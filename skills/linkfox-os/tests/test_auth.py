import contextlib
import importlib.util
import io
import os
from pathlib import Path
import shutil
import subprocess
import unittest
from unittest import mock


SCRIPT_PATH = Path(__file__).parents[1] / "scripts" / "linkfox_os.py"
SPEC = importlib.util.spec_from_file_location("linkfox_os", SCRIPT_PATH)
linkfox_os = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(linkfox_os)


class GetAPIKeyTests(unittest.TestCase):
    def test_environment_value_takes_precedence(self):
        with mock.patch.dict(os.environ, {"ZINIAO_API_KEY": "env-secret"}, clear=True):
            with mock.patch.object(linkfox_os.subprocess, "run") as run:
                run.side_effect = AssertionError("CLI must not run")
                self.assertEqual(linkfox_os.get_api_key(), "env-secret")

    def test_falls_back_to_cli_stored_credential(self):
        completed = subprocess.CompletedProcess(
            ["zn-open-eco", "auth", "get"], 0, stdout="Bearer cli-secret\n", stderr=""
        )
        with mock.patch.dict(os.environ, {}, clear=True):
            with mock.patch.object(shutil, "which", return_value="zn-open-eco"):
                with mock.patch.object(linkfox_os.subprocess, "run", return_value=completed):
                    self.assertEqual(linkfox_os.get_api_key(), "Bearer cli-secret")

    def test_uses_resolved_windows_command_shim(self):
        command = r"C:\Program Files\nodejs\zn-open-eco.CMD"
        completed = subprocess.CompletedProcess(
            [command, "auth", "get"], 0, stdout="Bearer cli-secret\n", stderr=""
        )
        with mock.patch.dict(os.environ, {}, clear=True):
            with mock.patch.object(shutil, "which", return_value=command):
                with mock.patch.object(
                    linkfox_os.subprocess, "run", return_value=completed
                ) as run:
                    self.assertEqual(linkfox_os.get_api_key(), "Bearer cli-secret")

        self.assertEqual(run.call_args.args[0][0], command)

    def test_cli_failure_does_not_echo_subprocess_output(self):
        completed = subprocess.CompletedProcess(
            ["zn-open-eco", "auth", "get"],
            1,
            stdout="secret-from-stdout",
            stderr="secret-from-stderr",
        )
        captured = io.StringIO()
        with mock.patch.dict(os.environ, {}, clear=True):
            with mock.patch.object(shutil, "which", return_value="zn-open-eco"):
                with mock.patch.object(linkfox_os.subprocess, "run", return_value=completed):
                    with contextlib.redirect_stderr(captured):
                        with self.assertRaises(SystemExit):
                            linkfox_os.get_api_key()

        self.assertNotIn("secret-from-stdout", captured.getvalue())
        self.assertNotIn("secret-from-stderr", captured.getvalue())
        self.assertIn("zn-open-eco auth set", captured.getvalue())

    def test_missing_cli_reports_safe_setup_instruction(self):
        captured = io.StringIO()
        with mock.patch.dict(os.environ, {}, clear=True):
            with mock.patch.object(shutil, "which", return_value="zn-open-eco"):
                with mock.patch.object(
                    linkfox_os.subprocess, "run", side_effect=FileNotFoundError("zn-open-eco")
                ):
                    with contextlib.redirect_stderr(captured):
                        with self.assertRaises(SystemExit):
                            linkfox_os.get_api_key()

        self.assertIn("zn-open-eco", captured.getvalue())
        self.assertIn("auth set", captured.getvalue())


if __name__ == "__main__":
    unittest.main()
