#!/usr/bin/env sh
set -eu
case " ${RENEWED_DOMAINS:-} " in
    *" mystery.laetipark.me "*) nginx -t && systemctl reload nginx ;;
esac
