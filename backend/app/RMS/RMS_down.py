import bigdataquery as bdq  
import pandas as pd  

# -------------------------------------------------  
# 1) 조회할 확장자 리스트  
# -------------------------------------------------  
ext_list = ['pol', 'con', 'meg', 'br', 'drpr']

# -------------------------------------------------  
# 2) 공통 WHERE 절  
# -------------------------------------------------  
BASE_WHERE = """  
WHERE 1=1  
  AND rcp_id LIKE '%.{ext}'  
  AND rcp_id NOT LIKE 'TT%'   
  AND rcp_id NOT LIKE 'RW%'  
  AND impala_insert_time >= DATE_TRUNC('DAY', NOW())  
  AND impala_insert_time < DATE_ADD(DATE_TRUNC('DAY', NOW()), 1)  
  AND line NOT IN ('A1','A2','B1','AB','AB-P','AB-V',  
                   'D1','D2','D3','D4','D5')  
"""

# -------------------------------------------------  
# 3) 쿼리 생성 함수  
# -------------------------------------------------  
def make_query(ext: str) -> str:  
    """확장자를 받아 완전한 SELECT 쿼리 문자열 반환"""  
    return f"""  
SELECT DISTINCT(rcp_id)  
FROM ees_ds_eai.rms_rcp_mst_rms  
{BASE_WHERE.format(ext=ext)}  
"""

# -------------------------------------------------  
# 4) DataFrame 수집 (리스트에 저장)  
# -------------------------------------------------  
df_list = []  
for ext in ext_list:  
    sql = make_query(ext)  
    try:  
        df = bdq.getData(param=sql, user_name='wonjun.yoon')  
        print(f"[{ext}] 조회 완료 – 행 수: {len(df)}")  
        df_list.append(df)  
    except Exception as e:  
        print(f"[{ext}] 조회 중 오류 발생 → {e}")

# -------------------------------------------------  
# 5) DataFrame 병합  
# -------------------------------------------------  
if df_list:  
    combined_df = pd.concat(df_list, ignore_index=True)  
    print(f"전체 병합 완료 – 총 행 수: {len(combined_df)}")  
else:  
    raise RuntimeError("조회된 DataFrame이 하나도 없습니다.")

# -------------------------------------------------  
# 6) CSV 저장  
# -------------------------------------------------  
output_path = "/root/project/recipe/backend/app/data/cloud_protected_files.csv"
combined_df.to_csv(output_path, index=False, encoding='utf-8-sig')  
print(f"CSV 파일 저장 완료 → {output_path}")