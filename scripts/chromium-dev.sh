#!/bin/sh
# Strip nix-ld paths from LD_LIBRARY_PATH to prevent glibc version mismatch
# when chrome-launcher spawns the NixOS Chromium wrapper.
export LD_LIBRARY_PATH=$(printf '%s' "$LD_LIBRARY_PATH" | tr ':' '\n' | grep -v 'nix-ld' | tr '\n' ':' | sed 's/:$//')
exec /etc/profiles/per-user/santhosh/bin/chromium "$@"
