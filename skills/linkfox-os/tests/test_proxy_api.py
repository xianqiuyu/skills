import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest import mock


SCRIPT_PATH = Path(__file__).parents[1] / "scripts" / "linkfox_os.py"
SPEC = importlib.util.spec_from_file_location("linkfox_os_proxy", SCRIPT_PATH)
linkfox_os = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(linkfox_os)


class Response:
    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return b'{"errcode":200,"data":{"title":"example"}}'


class ProxyAPITests(unittest.TestCase):
    def test_submits_unchanged_payload_to_synchronous_proxy_endpoint(self):
        payload = {"prompt": "query", "modelId": "default"}
        with mock.patch.dict("os.environ", {"ZINIAO_API_KEY": "secret"}, clear=True):
            with mock.patch.object(linkfox_os, "urlopen", return_value=Response()) as urlopen:
                response = linkfox_os.submit_task("query", "default")

        request = urlopen.call_args.args[0]
        self.assertEqual(
            request.full_url,
            "https://agent-swarm-test.ziniao.com/api/v1/claw/cli-proxy/open-api/linkfox",
        )
        self.assertEqual(json.loads(request.data.decode("utf-8")), payload)
        headers = {name.lower(): value for name, value in request.header_items()}
        self.assertEqual(headers["cli-type"], "zn-eco-user")
        self.assertEqual(urlopen.call_args.kwargs["timeout"], 1230)
        self.assertEqual(response, {"errcode": 200, "data": {"title": "example"}})


if __name__ == "__main__":
    unittest.main()
