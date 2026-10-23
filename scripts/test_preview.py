import errno
import io
import unittest
from contextlib import redirect_stderr
from unittest.mock import patch

import preview


class PreviewStartupTests(unittest.TestCase):
    def test_occupied_port_shows_url_and_alternative_without_traceback(self):
        stderr = io.StringIO()
        with (
            patch("sys.argv", ["preview.py"]),
            patch.object(preview.Path, "is_file", return_value=True),
            patch.object(
                preview,
                "ThreadingHTTPServer",
                side_effect=OSError(errno.EADDRINUSE, "Address already in use"),
            ),
            redirect_stderr(stderr),
            self.assertRaises(SystemExit) as exit_context,
        ):
            preview.main()
        self.assertEqual(exit_context.exception.code, 2)
        self.assertIn("Порт 4173 уже занят", stderr.getvalue())
        self.assertIn("http://127.0.0.1:4173", stderr.getvalue())
        self.assertIn("--port 4174", stderr.getvalue())
        self.assertNotIn("Traceback", stderr.getvalue())

    def test_other_socket_errors_are_not_misreported_as_port_conflicts(self):
        with (
            patch("sys.argv", ["preview.py"]),
            patch.object(preview.Path, "is_file", return_value=True),
            patch.object(
                preview,
                "ThreadingHTTPServer",
                side_effect=OSError(errno.EACCES, "Permission denied"),
            ),
            self.assertRaises(OSError) as error_context,
        ):
            preview.main()
        self.assertEqual(error_context.exception.errno, errno.EACCES)


if __name__ == "__main__":
    unittest.main()
