#!/usr/bin/env python3
"""Publish this project to GitHub without relying on local .git writes.

Usage:
  GITHUB_TOKEN=ghp_... python3 scripts/publish_github.py \
    --repo thebobhuff/CommandControl \
    --tag v0.1.0 \
    --release-notes RELEASE_NOTES.md

The token needs Contents: read/write and Metadata: read permissions. To create
the release, it also needs permission to create releases for the repository.
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import pathlib
import sys
import urllib.error
import urllib.request


SKIP_DIRS = {
    ".git",
    ".next",
    ".supabase",
    "node_modules",
}

SKIP_SUFFIXES = {
    ".bundle",
}

SKIP_FILES = {
    ".env.local",
    ".env",
}


def api_request(method: str, url: str, token: str, payload: dict | None = None) -> dict:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "commander-control-publisher",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} failed: HTTP {error.code}\n{body}") from error


def should_skip(path: pathlib.Path, root: pathlib.Path) -> bool:
    rel = path.relative_to(root)
    parts = set(rel.parts)

    if parts & SKIP_DIRS:
        return True
    if rel.name in SKIP_FILES:
        return True
    if path.suffix in SKIP_SUFFIXES:
        return True
    return False


def iter_files(root: pathlib.Path) -> list[pathlib.Path]:
    files: list[pathlib.Path] = []
    for path in root.rglob("*"):
      if path.is_file() and not should_skip(path, root):
          files.append(path)
    return sorted(files)


def create_blob(repo: str, token: str, path: pathlib.Path) -> str:
    content = base64.b64encode(path.read_bytes()).decode("ascii")
    result = api_request(
        "POST",
        f"https://api.github.com/repos/{repo}/git/blobs",
        token,
        {
            "content": content,
            "encoding": "base64",
        },
    )
    return result["sha"]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default="thebobhuff/CommandControl")
    parser.add_argument("--branch", default="main")
    parser.add_argument("--tag", default="v0.1.0")
    parser.add_argument("--release-title", default="Commander Control v0.1.0")
    parser.add_argument("--release-notes", default="RELEASE_NOTES.md")
    parser.add_argument("--root", default=".")
    args = parser.parse_args()

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("Set GITHUB_TOKEN before running this script.", file=sys.stderr)
        return 2

    root = pathlib.Path(args.root).resolve()
    files = iter_files(root)
    if not files:
        print("No files to publish.", file=sys.stderr)
        return 2

    print(f"Publishing {len(files)} files to {args.repo}:{args.branch}")

    repo_meta = api_request("GET", f"https://api.github.com/repos/{args.repo}", token)
    print(f"Repository: {repo_meta['full_name']}")

    ref_url = f"https://api.github.com/repos/{args.repo}/git/ref/heads/{args.branch}"
    ref = api_request("GET", ref_url, token)
    parent_sha = ref["object"]["sha"]

    parent_commit = api_request(
        "GET",
        f"https://api.github.com/repos/{args.repo}/git/commits/{parent_sha}",
        token,
    )
    base_tree_sha = parent_commit["tree"]["sha"]

    tree = []
    for index, path in enumerate(files, start=1):
        rel = path.relative_to(root).as_posix()
        sha = create_blob(args.repo, token, path)
        tree.append({
            "path": rel,
            "mode": "100755" if os.access(path, os.X_OK) else "100644",
            "type": "blob",
            "sha": sha,
        })
        if index % 25 == 0:
            print(f"  uploaded {index}/{len(files)}")

    tree_result = api_request(
        "POST",
        f"https://api.github.com/repos/{args.repo}/git/trees",
        token,
        {
            "base_tree": base_tree_sha,
            "tree": tree,
        },
    )

    commit = api_request(
        "POST",
        f"https://api.github.com/repos/{args.repo}/git/commits",
        token,
        {
            "message": "Initial Commander Control app",
            "tree": tree_result["sha"],
            "parents": [parent_sha],
        },
    )

    api_request(
        "PATCH",
        ref_url,
        token,
        {
            "sha": commit["sha"],
            "force": False,
        },
    )
    print(f"Updated {args.branch}: {commit['sha']}")

    release_notes_path = root / args.release_notes
    release_notes = release_notes_path.read_text(encoding="utf-8") if release_notes_path.exists() else ""

    release = api_request(
        "POST",
        f"https://api.github.com/repos/{args.repo}/releases",
        token,
        {
            "tag_name": args.tag,
            "target_commitish": commit["sha"],
            "name": args.release_title,
            "body": release_notes,
            "draft": False,
            "prerelease": False,
        },
    )

    print(f"Release: {release.get('html_url')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
