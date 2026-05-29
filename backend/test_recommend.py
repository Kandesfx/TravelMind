import requests
import json
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE = 'http://localhost:5000/api/public/combos/recommend'

test_cases = [
    {'hotel_type': 'Resort', 'group': 'Family', 'season': 'Summer', 'budget': 'Mid'},
    {'hotel_type': 'City', 'group': 'Solo', 'season': 'Winter', 'budget': 'Budget'},
    {'hotel_type': 'Resort', 'group': 'Couple', 'season': 'Autumn', 'budget': 'Premium'},
    {'hotel_type': 'City', 'group': 'Large', 'season': 'Spring', 'budget': 'Mid'},
]

all_first_names = []

for tc in test_cases:
    label = f"{tc['hotel_type']}/{tc['group']}/{tc['season']}/{tc['budget']}"
    print(f"\n=== {label} ===")
    try:
        res = requests.post(BASE, json=tc, timeout=30)
        data = res.json()
        recs = data.get('recommendations', [])
        for r in recs:
            combo = r['combo']
            print(f"  #{r['rank']}: {combo['name']} | score={r['match_score']} | conf={r['confidence']} | lift={r['lift']}")
            print(f"      services: {combo['services']}")
            if r.get('rule_explanation'):
                print(f"      reason: {r['rule_explanation']}")
        if recs:
            all_first_names.append(recs[0]['combo']['name'])
        else:
            print("  No recommendations returned!")
            all_first_names.append("EMPTY")
    except Exception as e:
        print(f"  Error: {e}")
        all_first_names.append("ERROR")

print("\n\n=== DIVERSITY CHECK ===")
print(f"First combo names across 4 tests: {all_first_names}")
unique = len(set(all_first_names))
print(f"Unique names: {unique}/4")
if unique >= 3:
    print("PASS: Results are properly diversified!")
else:
    print("FAIL: Results are too similar!")
