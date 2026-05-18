from __future__ import annotations

import ftplib
from io import BytesIO
from typing import Any

from .ftp_credentials import load_eqp_ip
from .temp_file_store import write_local_shadow_file

def connect_ftp(ftp_ip: str, ftp_id: str, ftp_pw: str) -> ftplib.FTP:
    ftp = ftplib.FTP(timeout=12)
    ftp.connect(ftp_ip, 21)
    ftp.login(user=ftp_id, passwd=ftp_pw)
    return ftp

def ftp_read_bytes_at_path(ftp_ip: str, ftp_id: str, ftp_pw: str, path: str, file_name: str) -> bytes:
    ftp = connect_ftp(ftp_ip, ftp_id, ftp_pw)
    try:
        ftp.cwd(path)
        buf = BytesIO()
        ftp.retrbinary(f"RETR {file_name}", buf.write)
        return buf.getvalue()
    finally:
        try:
            ftp.quit()
        except Exception:
            try:
                ftp.close()
            except Exception:
                pass

def ftp_write_bytes_at_path(ftp_ip: str, ftp_id: str, ftp_pw: str, path: str, file_name: str, data: bytes) -> None:
    ftp = connect_ftp(ftp_ip, ftp_id, ftp_pw)
    try:
        ftp.cwd(path)
        ftp.storbinary(f"STOR {file_name}", BytesIO(data))
    finally:
        try:
            ftp.quit()
        except Exception:
            try:
                ftp.close()
            except Exception:
                pass

def ftp_delete_at_path(ftp_ip: str, ftp_id: str, ftp_pw: str, path: str, file_name: str) -> None:
    ftp = connect_ftp(ftp_ip, ftp_id, ftp_pw)
    try:
        ftp.cwd(path)
        ftp.delete(file_name)
    finally:
        try:
            ftp.quit()
        except Exception:
            try:
                ftp.close()
            except Exception:
                pass

def ftp_file_exists_at_path(ftp_ip: str, ftp_id: str, ftp_pw: str, path: str, file_name: str) -> bool:
    ftp = connect_ftp(ftp_ip, ftp_id, ftp_pw)
    try:
        ftp.cwd(path)
        try:
            ftp.size(file_name)
            return True
        except Exception:
            try:
                return file_name in {str(name).strip() for name in ftp.nlst()}
            except Exception:
                return False
    finally:
        try:
            ftp.quit()
        except Exception:
            try:
                ftp.close()
            except Exception:
                pass

def ftp_read_text_at_path(ftp_ip: str, ftp_id: str, ftp_pw: str, path: str, file_name: str) -> str:
    data = ftp_read_bytes_at_path(ftp_ip, ftp_id, ftp_pw, path, file_name)
    for enc in ("utf-8", "cp949", "euc-kr", "latin1"):
        try:
            return data.decode(enc)
        except Exception:
            continue
    return data.decode("utf-8", errors="replace")

def ftp_copy_with_shadow(
    source_eqp_id: str, 
    source_path: str, 
    source_name: str, 
    target_eqp_id: str, 
    target_path: str, 
    target_name: str
) -> dict[str, Any]:
    src_ip, src_id, src_pw = load_eqp_ip(source_eqp_id)
    data = ftp_read_bytes_at_path(src_ip, src_id, src_pw, source_path, source_name)
    write_local_shadow_file(target_name, data)
    tgt_ip, tgt_id, tgt_pw = load_eqp_ip(target_eqp_id)
    existed = ftp_file_exists_at_path(tgt_ip, tgt_id, tgt_pw, target_path, target_name)
    ftp_write_bytes_at_path(tgt_ip, tgt_id, tgt_pw, target_path, target_name, data)
    return {"writtenBytes": len(data), "overwrote": existed}

def ftp_copy_delete_with_shadow(eqp_id: str, path: str, source_name: str, target_name: str) -> dict[str, Any]:
    result = ftp_copy_with_shadow(eqp_id, path, source_name, eqp_id, path, target_name)
    if source_name != target_name:
        ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqp_id)
        ftp_delete_at_path(ftp_ip, ftp_id, ftp_pw, path, source_name)
    return result

def ftp_delete_with_shadow(eqp_id: str, path: str, file_name: str) -> dict[str, Any]:
    ftp_ip, ftp_id, ftp_pw = load_eqp_ip(eqp_id)
    data = ftp_read_bytes_at_path(ftp_ip, ftp_id, ftp_pw, path, file_name)
    shadow_path = write_local_shadow_file(file_name, data)
    ftp_delete_at_path(ftp_ip, ftp_id, ftp_pw, path, file_name)
    return {"deleted": True, "shadowPath": shadow_path, "writtenBytes": len(data)}

def format_ftp_error(exc: Exception) -> str:
    message = str(exc)
    return f"FTP 550: {message}" if "550" in message else message