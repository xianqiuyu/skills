import importlib.util
from pathlib import Path
import unittest
from unittest import mock


SKILL_ROOT = Path(__file__).parents[1]
SCRIPT_PATH = SKILL_ROOT / "scripts" / "linkfox_os.py"
SPEC = importlib.util.spec_from_file_location("linkfox_os_encoding", SCRIPT_PATH)
linkfox_os = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(linkfox_os)


class TextStream:
    def __init__(self):
        self.options = None

    def reconfigure(self, **options):
        self.options = options


class EncodingTests(unittest.TestCase):
    def test_configures_supported_standard_streams_as_utf8(self):
        streams = [TextStream(), TextStream(), TextStream()]
        with mock.patch.multiple(
            linkfox_os.sys, stdin=streams[0], stdout=streams[1], stderr=streams[2]
        ):
            linkfox_os._configure_utf8_stdio()

        for stream in streams:
            self.assertEqual(stream.options, {"encoding": "utf-8", "errors": "replace"})

    def test_skill_requires_explicit_utf8_for_powershell_reads(self):
        text = (SKILL_ROOT / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn("Get-Content -Encoding UTF8", text)


if __name__ == "__main__":
    unittest.main()
