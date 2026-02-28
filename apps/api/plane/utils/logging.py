# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import logging
import logging.handlers as handlers
import os
import sys
import time


class SizedTimedRotatingFileHandler(handlers.TimedRotatingFileHandler):
    """
    Handler for logging to a set of files, which switches from one file
    to the next when the current file reaches a certain size, or at certain
    timed intervals.

    If the log directory is not writable (e.g. volume mount permission issues
    in Docker/Podman/Kubernetes), file logging is silently disabled and the
    handler becomes a no-op. Logs remain available via stdout handlers.
    """

    def __init__(
        self,
        filename,
        maxBytes=0,
        backupCount=0,
        encoding=None,
        delay=0,
        when="h",
        interval=1,
        utc=False,
    ):
        self.maxBytes = maxBytes
        self._disabled = False

        # Ensure the log directory exists
        log_dir = os.path.dirname(filename)
        try:
            os.makedirs(log_dir, exist_ok=True)
            handlers.TimedRotatingFileHandler.__init__(
                self, filename, when, interval, backupCount, encoding, delay, utc
            )
        except (PermissionError, OSError) as e:
            # Fall back to a no-op handler when file is not writable.
            # Set attributes that parent classes (StreamHandler, FileHandler,
            # BaseRotatingHandler) expect so close() and other inherited
            # methods don't raise AttributeError.
            logging.Handler.__init__(self)
            self.stream = None
            self.baseFilename = os.path.abspath(filename)
            self._disabled = True
            print(
                f"WARNING: Unable to open log file '{filename}': {e}. "
                f"File logging disabled, logs are still available via stdout.",
                file=sys.stderr,
            )

    def emit(self, record):
        if self._disabled:
            return
        super().emit(record)

    def close(self):
        if self._disabled:
            logging.Handler.close(self)
            return
        super().close()

    def shouldRollover(self, record):
        """
        Determine if rollover should occur.

        Basically, see if the supplied record would cause the file to exceed
        the size limit we have.
        """
        if self._disabled:
            return 0
        if self.stream is None:  # delay was set...
            self.stream = self._open()
        if self.maxBytes > 0:  # are we rolling over?
            msg = "%s\n" % self.format(record)
            # due to non-posix-compliant Windows feature
            self.stream.seek(0, 2)
            if self.stream.tell() + len(msg) >= self.maxBytes:
                return 1
        t = int(time.time())
        if t >= self.rolloverAt:
            return 1
        return 0
