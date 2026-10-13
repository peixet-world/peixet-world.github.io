#!/usr/bin/env python3
"""Build-time site preparation.

1. Regenerates pdfs/metadata/manifest.json from the PDFs that actually exist
   in pdfs/, merging their optional metadata files from pdfs/metadata/<name>.json.
2. Injects environment-specific values into config.json:
   - GITHUB_REPOSITORY (provided by Actions) -> github.repo, giscus.repo, site.owner
   - GISCUS_REPO_ID / GISCUS_CATEGORY_ID (repository variables) -> giscus.repoId / giscus.categoryId

Runs in CI on every deploy, and locally for previews:

    python3 scripts/build-site.py           # validate + write
    python3 scripts/build-site.py --check   # validate only, write nothing

The committed manifest is a convenience for local previews; the CI output is
authoritative.
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "pdfs"
META_DIR = PDF_DIR / "metadata"
MANIFEST_PATH = META_DIR / "manifest.json"
CONFIG_PATH = ROOT / "config.json"

# Metadata files that are not per-PDF metadata
RESERVED_METADATA_STEMS = {"manifest", "schema"}

errors = []
warnings = []


def error(message):
    errors.append(message)


def warn(message):
    warnings.append(message)


def load_json(path, label):
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        error("%s not found: %s" % (label, path))
    except json.JSONDecodeError as exc:
        error("%s is not valid JSON (%s): %s" % (label, path, exc))
    return None


def git_upload_date(relative_path):
    """Upload date from the commit that last touched the file, else file mtime."""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cI", "--", relative_path],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
        )
        date = result.stdout.strip()
        if result.returncode == 0 and date:
            return date, False
    except OSError:
        pass
    # Untracked file (or git unavailable): fall back to the file modification time
    modified = (ROOT / relative_path).stat().st_mtime
    stamp = datetime.fromtimestamp(modified, tz=timezone.utc).replace(microsecond=0)
    return stamp.isoformat().replace("+00:00", "Z"), True


def validate_metadata(metadata, source):
    """Validate the required fields documented in docs/metadata-schema.md."""
    valid = True

    if not isinstance(metadata, dict):
        error("%s: metadata must be a JSON object" % source)
        return False

    for field in ("title", "description", "tags"):
        if field not in metadata:
            error("%s: missing required field '%s'" % (source, field))
            valid = False

    if "title" in metadata and (not isinstance(metadata["title"], str) or not metadata["title"].strip()):
        error("%s: 'title' must be a non-empty string" % source)
        valid = False

    if "description" in metadata and not isinstance(metadata["description"], str):
        error("%s: 'description' must be a string" % source)
        valid = False

    if "tags" in metadata:
        tags = metadata["tags"]
        if not isinstance(tags, list) or any(not isinstance(tag, str) for tag in tags):
            error("%s: 'tags' must be an array of strings" % source)
            valid = False
        elif not tags:
            warn("%s: 'tags' is empty - the document will not appear in tag filters" % source)

    return valid


def title_from_filename(filename):
    stem = filename[:-4] if filename.lower().endswith(".pdf") else filename
    return " ".join(part.capitalize() for part in stem.replace("-", " ").replace("_", " ").split())


def build_manifest(check_only):
    if not PDF_DIR.is_dir():
        error("missing pdfs/ directory: %s" % PDF_DIR)
        return None

    pdf_files = sorted(PDF_DIR.glob("*.pdf"), key=lambda path: path.name.lower())
    metadata_files = sorted(META_DIR.glob("*.json"), key=lambda path: path.name.lower())

    known_metadata = {path.stem for path in metadata_files} - RESERVED_METADATA_STEMS
    pdf_stems = {path.stem for path in pdf_files}

    for orphan in sorted(known_metadata - pdf_stems):
        warn("metadata file without a matching PDF (ignored): pdfs/metadata/%s.json" % orphan)

    entries = []
    for pdf_path in pdf_files:
        filename = pdf_path.name
        stem = pdf_path.stem
        metadata_path = META_DIR / ("%s.json" % stem)
        metadata = None

        if metadata_path.exists():
            metadata = load_json(metadata_path, "metadata for %s" % filename)
            if metadata is not None and not validate_metadata(metadata, str(metadata_path.relative_to(ROOT))):
                metadata = None

        upload_date, approximated = git_upload_date("pdfs/%s" % filename)
        if approximated:
            warn("%s is not tracked by git - uploadDate falls back to file mtime" % filename)

        entry = {
            "filename": filename,
            "fileSize": pdf_path.stat().st_size,
            "uploadDate": upload_date,
            "hasMetadata": metadata is not None,
        }
        if metadata is not None:
            entry["title"] = metadata.get("title") or title_from_filename(filename)
            if metadata.get("featured"):
                entry["featured"] = True
            if metadata.get("category"):
                entry["category"] = metadata["category"]
        entries.append(entry)

    upload_dates = [entry["uploadDate"] for entry in entries]
    file_sizes = [entry["fileSize"] for entry in entries]
    categories = sorted(
        {entry["category"] for entry in entries if entry.get("category")}
    )

    manifest = {
        "version": "1.0",
        "lastUpdated": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "description": "Manifest file listing all available PDF files in the repository. "
                       "Generated by scripts/build-site.py - do not edit by hand.",
        "totalFiles": len(entries),
        "totalSize": sum(file_sizes),
        "categories": categories,
        "files": entries,
        "statistics": {
            "featuredCount": sum(1 for entry in entries if entry.get("featured")),
            "withMetadata": sum(1 for entry in entries if entry["hasMetadata"]),
            "averageFileSize": int(sum(file_sizes) / len(file_sizes)) if file_sizes else 0,
            "lastAdded": max(upload_dates) if upload_dates else None,
        },
    }

    if not entries:
        warn("no PDF files found in pdfs/ - the site will show an empty library")

    if not check_only:
        with MANIFEST_PATH.open("w", encoding="utf-8") as handle:
            json.dump(manifest, handle, indent=2, ensure_ascii=False)
            handle.write("\n")

    return manifest


def inject_config(check_only):
    config = load_json(CONFIG_PATH, "config.json")
    if config is None:
        return None, []

    changes = []

    repository = os.environ.get("GITHUB_REPOSITORY", "").strip()
    if repository:
        config.setdefault("github", {})["repo"] = repository
        config.setdefault("site", {})["owner"] = repository.split("/")[0]
        config.setdefault("giscus", {})["repo"] = repository
        changes.append("github.repo/giscus.repo -> %s" % repository)

    for variable, key in (("GISCUS_REPO_ID", "repoId"), ("GISCUS_CATEGORY_ID", "categoryId")):
        value = os.environ.get(variable, "").strip()
        if value:
            config.setdefault("giscus", {})[key] = value
            changes.append("giscus.%s -> %s" % (key, value))

    if changes and not check_only:
        with CONFIG_PATH.open("w", encoding="utf-8") as handle:
            json.dump(config, handle, indent=2, ensure_ascii=False)
            handle.write("\n")

    return config, changes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="validate content only; do not write manifest.json or config.json",
    )
    args = parser.parse_args()

    config, config_changes = inject_config(args.check)
    manifest = build_manifest(args.check)

    for message in warnings:
        print("WARNING: %s" % message)
    for message in errors:
        print("ERROR: %s" % message, file=sys.stderr)

    if errors:
        print("\nBuild failed with %d error(s)." % len(errors), file=sys.stderr)
        return 1

    if config is None:
        config_status = "missing"
    elif config_changes:
        config_status = "updated (%s)" % ", ".join(config_changes)
    else:
        config_status = "unchanged (no repository overrides in this environment)"

    mode = "checked" if args.check else "written"
    print(
        "Manifest %s: %d PDF(s), %d byte(s). Config %s."
        % (mode, manifest["totalFiles"], manifest["totalSize"], config_status)
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
