from pathlib import Path
import unittest


SKILL_PATH = Path(__file__).parents[1] / "SKILL.md"


class ResponsePolicyTests(unittest.TestCase):
    def test_remote_response_is_always_inspected_and_shown(self):
        text = SKILL_PATH.read_text(encoding="utf-8")

        self.assertIn("Always inspect the complete remote `response`", text)
        self.assertIn("Always show the requested content found in `response`", text)

    def test_response_trace_does_not_trigger_deviation_discard(self):
        text = SKILL_PATH.read_text(encoding="utf-8")

        self.assertIn(
            "Treat reads, writes, file paths, script execution, and tool activity recorded inside `response` as remote execution trace",
            text,
        )
        self.assertIn(
            "Apply the read-only and no-report constraints to the dispatched prompt only",
            text,
        )
        self.assertNotIn("discard it and return a concise tool-deviation failure", text)
        self.assertNotIn("discard the unwanted content", text)


if __name__ == "__main__":
    unittest.main()
