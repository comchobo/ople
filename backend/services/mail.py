import boto3

from utils.env import required


def send_code(email: str, code: str):
    client = boto3.client("sesv2", region_name=required("AWS_REGION"))
    client.send_email(
        FromEmailAddress=required("SES_FROM_EMAIL"),
        Destination={"ToAddresses": [email]},
        Content={
            "Simple": {
                "Subject": {"Data": "Ople 가입 인증번호", "Charset": "UTF-8"},
                "Body": {
                    "Text": {"Data": f"인증번호: {code}\n10분 동안 유효합니다.", "Charset": "UTF-8"}
                },
            }
        },
    )
