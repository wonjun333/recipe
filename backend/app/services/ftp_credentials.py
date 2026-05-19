from __future__ import annotations

from dataclasses import dataclass
from pymongo import MongoClient

from app.config import MONGO_URL

@dataclass(frozen=True)
class FtpCredential:
    host: str
    user: str
    password: str

def load_eqp_ip(eqp_id: str) -> tuple[str, str, str]:
    client = MongoClient(
        MONGO_URL,
        serverSelectionTimeoutMS=3000,
    )
    try:
        db = client["ADDCMP"]
        collection = db["FTP_STATUS"]

        doc = collection.find_one(
            {"EQPID": eqp_id},
            {
                "_id": 0,
                "FTP_SERVER": 1,
                "FTP_ID": 1,
                "FTP_PW": 1,
            },
        )

        if not doc:
            raise ValueError(f"EQPID not found: {eqp_id}")

        ftp_ip = doc.get("FTP_SERVER")
        ftp_id = doc.get("FTP_ID")
        ftp_pw = doc.get("FTP_PW")

        if not isinstance(ftp_ip, str) or not ftp_ip.strip():
            raise ValueError("FTP_SERVER is missing")
        if not isinstance(ftp_id, str) or not ftp_id.strip():
            raise ValueError("FTP_ID is missing")
        if not isinstance(ftp_pw, str):
            raise ValueError("FTP_PW is missing")

        return ftp_ip, ftp_id, ftp_pw
    finally:
        client.close()

def load_eqp_credential(eqp_id: str) -> FtpCredential:
    ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqp_id)
    return FtpCredential(host=ftp_ip, user=ftp_id, password=ftp_pw)
