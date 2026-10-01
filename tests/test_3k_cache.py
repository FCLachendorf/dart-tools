import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('cache', Path(__file__).parents[1] / 'scripts/update_3k_cache.py')
cache = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cache)

class CacheTests(unittest.TestCase):
    def test_failed_performance_keeps_original_timestamp(self):
        old = {'updatedAt':'2026-09-28T12:00:00Z','participants':{'1':{'finish':120,'counter':2,'performanceKnown':True}}}
        def fetch(path):
            if path.endswith('/table'): return {'tableEntries':[{'tableEntries':[{'participantId':1,'points1':6,'placement':'1.','matchCount':3}]}]}
            if path.endswith('/participant'): return [{'id':1,'displayName':'FC Lachendorf Darts A','team':{'id':9}}]
            raise OSError('offline')
        with patch.object(cache,'fetch_json',side_effect=fetch):
            result, partial = cache.build_event(1428,old)
        self.assertTrue(partial)
        row=result['participants']['1']
        self.assertEqual(row['finish'],120)
        self.assertEqual(row['performanceCheckedAt'],old['updatedAt'])
        self.assertTrue(row['performanceStale'])

    def test_total_outage_fails_without_overwriting_snapshot(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'cache.json'; path.write_text('{"events": {}}')
            before=path.read_bytes()
            with patch.object(cache,'CACHE_PATH',path), patch.object(cache,'fetch_json',side_effect=OSError('offline')):
                self.assertEqual(cache.main(),1)
            self.assertEqual(path.read_bytes(),before)

    def test_partial_event_failure_saves_good_event_and_reports_failure(self):
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'cache.json'
            old={'events':{'1422':{'updatedAt':'old','participants':{}}}}
            path.write_text(json.dumps(old))
            def build(event,previous):
                if event==1422: raise OSError('offline')
                return {'checkedAt':'new','participants':{'1':{'displayName':'FC Lachendorf Darts A'}}},False
            with patch.object(cache,'CACHE_PATH',path), patch.object(cache,'build_event',side_effect=build):
                self.assertEqual(cache.main(),1)
            result=json.loads(path.read_text())
            self.assertEqual(result['events']['1422'],old['events']['1422'])
            self.assertEqual(result['events']['1428']['checkedAt'],'new')

if __name__ == '__main__': unittest.main()
