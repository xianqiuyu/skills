from pathlib import Path
import re
import unittest


SKILL_ROOT = Path(__file__).parents[1]
SKILL_PATH = SKILL_ROOT / "SKILL.md"
REFERENCES_ROOT = SKILL_ROOT / "references"
REMOVED_CAPABILITY_REFERENCES = {
    "skills-listing.md",
    "skills-market-analysis.md",
    "skills-media.md",
    "skills-selection.md",
}


class ReferenceRoutingTests(unittest.TestCase):
    def test_removed_capability_catalogs_are_absent_and_unreferenced(self):
        skill_text = SKILL_PATH.read_text(encoding="utf-8")

        for filename in REMOVED_CAPABILITY_REFERENCES:
            with self.subTest(filename=filename):
                self.assertFalse((REFERENCES_ROOT / filename).exists())
                self.assertNotIn(f"references/{filename}", skill_text)

    def test_every_child_markdown_reference_is_classified_by_entrypoint(self):
        skill_text = SKILL_PATH.read_text(encoding="utf-8")
        referenced_paths = {
            str(Path(*match.split("/")))
            for match in re.findall(r"references/[A-Za-z0-9._/-]+\.md", skill_text)
        }
        actual_paths = {
            str(path.relative_to(SKILL_ROOT)) for path in REFERENCES_ROOT.glob("*.md")
        }

        self.assertEqual(actual_paths, referenced_paths)

    def test_all_classified_reference_paths_exist(self):
        skill_text = SKILL_PATH.read_text(encoding="utf-8")
        for relative_path in re.findall(
            r"references/[A-Za-z0-9._/-]+\.md", skill_text
        ):
            with self.subTest(relative_path=relative_path):
                self.assertTrue((SKILL_ROOT / relative_path).is_file())


if __name__ == "__main__":
    unittest.main()
