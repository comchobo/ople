import boto3
from botocore.stub import Stubber

from services.external import email as mail


def test_signup_code_is_sent_through_ses_with_expected_recipient_and_content(monkeypatch):
    monkeypatch.setenv("AWS_REGION", "ap-northeast-2")
    monkeypatch.setenv("SES_FROM_EMAIL", "noreply@example.com")
    client = boto3.client(
        "sesv2",
        region_name="ap-northeast-2",
        aws_access_key_id="test",
        aws_secret_access_key="test",
    )
    stub = Stubber(client)
    stub.add_response(
        "send_email",
        {"MessageId": "message"},
        {
            "FromEmailAddress": "noreply@example.com",
            "Destination": {"ToAddresses": ["hello@example.com"]},
            "Content": {
                "Simple": {
                    "Subject": {"Data": "Ople 가입 인증번호", "Charset": "UTF-8"},
                    "Body": {
                        "Text": {
                            "Data": "인증번호: 012345\n10분 동안 유효합니다.",
                            "Charset": "UTF-8",
                        }
                    },
                }
            },
        },
    )

    def ses_client(service, *, region_name):
        assert service == "sesv2" and region_name == "ap-northeast-2"
        return client

    monkeypatch.setattr(mail.boto3, "client", ses_client)
    with stub:
        mail.send_code("hello@example.com", "012345")
        stub.assert_no_pending_responses()
