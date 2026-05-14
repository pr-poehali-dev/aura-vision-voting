"""Сохранение и получение суммарных голосов для AuraVision 2026."""
import json
import os

SCHEMA = "t_p54632608_aura_vision_voting"

def handler(event: dict, context) -> dict:
    import psycopg2

    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])

    if method == "GET":
        cur = conn.cursor()
        cur.execute(
            f"SELECT country_id, SUM(vote_count) FROM {SCHEMA}.votes GROUP BY country_id"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        totals = {row[0]: int(row[1]) for row in rows}
        return {
            "statusCode": 200,
            "headers": cors,
            "body": json.dumps({"totals": totals}),
        }

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        voter_id = body.get("voter_id", "")
        votes = body.get("votes", {})

        if not voter_id or not isinstance(votes, dict):
            return {"statusCode": 400, "headers": cors, "body": json.dumps({"error": "voter_id and votes required"})}

        cur = conn.cursor()
        for country_id, count in votes.items():
            count = max(0, min(3, int(count)))
            if count == 0:
                cur.execute(
                    f"DELETE FROM {SCHEMA}.votes WHERE country_id = %s AND voter_id = %s",
                    (country_id, voter_id)
                )
            else:
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.votes (country_id, voter_id, vote_count)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (country_id, voter_id)
                        DO UPDATE SET vote_count = EXCLUDED.vote_count, updated_at = NOW()""",
                    (country_id, voter_id, count)
                )
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": cors, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 405, "headers": cors, "body": json.dumps({"error": "Method not allowed"})}
