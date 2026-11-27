import json
import unittest
from unittest.mock import patch

import server


class PlannerTests(unittest.TestCase):
    def test_tenth_turn_collects_three_validated_plans_without_model_edit_state(self):
        draft = {'title': '사람과 이야기를 잇는 작은 출판사를 연다'.split(),
                 'years': [{'work': '원고를 다듬는다', 'life': '산을 걷는다'}]*6,
                 'questions': ['누구와 시작할까?', '어디에서 시작할까?'],
                 'strokes': ['not application state']}
        with patch.object(server, 'chat', return_value=json.dumps(draft)) as chat:
            turns = [{'q': '무엇을 하고 싶나요?', 'a': '책을 낼래요.'}]*10
            result = server.compose(turns)['plans']
            self.assertTrue(server.plan_shape(result))
            self.assertTrue(all('strokes' not in p for p in result))
            self.assertEqual(len({c.args[0][0]['content'] for c in chat.call_args_list}), 3)

    def test_invalid_draft_does_not_advance_interview(self):
        with patch.object(server, 'chat', return_value='{"title": "제목"}') as chat:
            with self.assertRaises(RuntimeError):
                server.draft('대화', '현재 길')
            self.assertEqual(chat.call_count, 2)

    def test_empty_transcription_is_retryable_not_a_turn(self):
        with patch.dict('os.environ', CLOUDFLARE_ACCOUNT_ID='account', CLOUDFLARE_STT_MODEL='model'), patch.object(server, 'external', return_value={'result': {'text': ' '}}) as api:
            with self.assertRaises(ValueError):
                server.transcribe(b'abc')
            self.assertEqual(api.call_args.args[2], {'audio': 'YWJj', 'language': 'ko', 'task': 'transcribe'})


if __name__ == '__main__':
    unittest.main()
