import urllib.request, urllib.parse, json, time, sys

offices_data = [
    {
        "id": "provinsi_jabar",
        "name": "Dinas Sosial Provinsi Jawa Barat",
        "queries": [
            "Dinas Sosial Provinsi Jawa Barat",
            "Dinas Sosial Cigugur Tengah Cimahi",
            "Jalan Jend. H. Amir Machmud No. 331, Cimahi"
        ]
    },
    {
        "id": "kab_bandung",
        "name": "Dinas Sosial Kabupaten Bandung",
        "queries": [
            "Dinas Sosial Kabupaten Bandung",
            "Komplek Pemkab Bandung Soreang",
            "Dinas Sosial Soreang",
            "Jalan Raya Soreang KM 17 Soreang"
        ]
    },
    {
        "id": "kab_bandung_barat",
        "name": "Dinas Sosial Kabupaten Bandung Barat",
        "queries": [
            "Dinas Sosial Kabupaten Bandung Barat",
            "Kompleks Perkantoran Pemkab Bandung Barat",
            "Dinas Sosial Ngamprah",
            "Jalan Raya Padalarang Cisarua Ngamprah"
        ]
    },
    {
        "id": "kota_bandung",
        "name": "Dinas Sosial Kota Bandung",
        "queries": [
            "Dinas Sosial Kota Bandung Babakan Karet",
            "Dinas Sosial Kota Bandung",
            "Dinas Sosial Rancacili Derwati",
            "Jalan Babakan Karet Derwati Rancasari Bandung"
        ]
    },
    {
        "id": "kota_cimahi",
        "name": "Dinas Sosial Kota Cimahi",
        "queries": [
            "Dinas Sosial Kota Cimahi",
            "Kompleks Perkantoran Pemkot Cimahi Demang Hardjakusumah",
            "Dinas Sosial Cimahi Utara Demang Hardjakusumah"
        ]
    },
    {
        "id": "kab_bogor",
        "name": "Dinas Sosial Kabupaten Bogor",
        "queries": [
            "DINAS SOSIAL KABUPATEN BOGOR",
            "Dinas Sosial Kabupaten Bogor Jalan Bersih",
            "Dinas Sosial Cibinong Bogor"
        ]
    },
    {
        "id": "kota_bogor",
        "name": "Dinas Sosial Kota Bogor",
        "queries": [
            "Dinas Sosial Kota Bogor Jalan Merdeka",
            "Dinas Sosial Kota Bogor",
            "Jalan Merdeka No. 142 Ciwaringin Bogor"
        ]
    },
    {
        "id": "kota_depok",
        "name": "Dinas Sosial Kota Depok",
        "queries": [
            "Gedung Dibaleka II Depok",
            "Dinas Sosial Kota Depok",
            "Balaikota Depok Margonda",
            "Jalan Margonda Raya No. 54 Depok"
        ]
    },
    {
        "id": "kab_bekasi",
        "name": "Dinas Sosial Kabupaten Bekasi",
        "queries": [
            "Dinas Sosial Kabupaten Bekasi",
            "Kompleks Perkantoran Pemkab Bekasi Sukamahi Cikarang Pusat",
            "Dinas Sosial Cikarang Pusat"
        ]
    },
    {
        "id": "kota_bekasi",
        "name": "Dinas Sosial Kota Bekasi",
        "queries": [
            "Dinas Sosial Kota Bekasi",
            "Jalan Ir. H. Juanda No. 100 Bekasi",
            "Dinas Sosial Bekasi Timur"
        ]
    },
    {
        "id": "kab_karawang",
        "name": "Dinas Sosial Kabupaten Karawang",
        "queries": [
            "Dinas Sosial Kabupaten Karawang",
            "Jalan Husni Hamid No. 3 Karawang",
            "Dinas Sosial Karawang Barat"
        ]
    },
    {
        "id": "kab_purwakarta",
        "name": "Dinas Sosial Kabupaten Purwakarta",
        "queries": [
            "Dinas Sosial Pemberdayaan Perempuan dan Perlindungan Anak Purwakarta",
            "Dinas Sosial Purwakarta",
            "Jalan Taman Pahlawan Purwakarta"
        ]
    },
    {
        "id": "kab_subang",
        "name": "Dinas Sosial Kabupaten Subang",
        "queries": [
            "Dinas Sosial Kabupaten Subang",
            "Jalan D.I. Panjaitan No. 31 Subang",
            "Dinas Sosial Soklat Subang"
        ]
    },
    {
        "id": "kab_sukabumi",
        "name": "Dinas Sosial Kabupaten Sukabumi",
        "queries": [
            "Dinas Sosial Kabupaten Sukabumi Cisaat",
            "Gelanggang Pemuda Cisaat Sukabumi",
            "Dinas Sosial Sukabumi Cisaat"
        ]
    },
    {
        "id": "kota_sukabumi",
        "name": "Dinas Sosial Kota Sukabumi",
        "queries": [
            "Dinas Sosial Kota Sukabumi",
            "Jalan Ciaul Pasir Sukabumi",
            "Dinas Sosial Cikole Sukabumi"
        ]
    },
    {
        "id": "kab_cianjur",
        "name": "Dinas Sosial Kabupaten Cianjur",
        "queries": [
            "Dinas Sosial Kabupaten Cianjur",
            "Jalan Raya Bandung Bojong Karangtengah Cianjur",
            "Dinas Sosial Cianjur"
        ]
    },
    {
        "id": "kab_garut",
        "name": "Dinas Sosial Kabupaten Garut",
        "queries": [
            "Dinas Sosial Kabupaten Garut",
            "Jalan Patriot No. 14 Sukagalih Tarogong Kidul Garut",
            "Dinas Sosial Tarogong Kidul Garut"
        ]
    },
    {
        "id": "kab_tasikmalaya",
        "name": "Dinas Sosial Kabupaten Tasikmalaya",
        "queries": [
            "Dinas Sosial Kabupaten Tasikmalaya",
            "Komplek Pemkab Tasikmalaya Sukapura Singaparna",
            "Dinas Sosial Singaparna Tasikmalaya"
        ]
    },
    {
        "id": "kota_tasikmalaya",
        "name": "Dinas Sosial Kota Tasikmalaya",
        "queries": [
            "Dinas Sosial Kota Tasikmalaya",
            "Jalan Ir. H. Juanda No. 191 Tasikmalaya",
            "Dinas Sosial Bungursari Tasikmalaya"
        ]
    },
    {
        "id": "kab_ciamis",
        "name": "Dinas Sosial Kabupaten Ciamis",
        "queries": [
            "Dinas Sosial Kabupaten Ciamis",
            "Jalan Tentara Pelajar No. 24 Ciamis",
            "Dinas Sosial Ciamis"
        ]
    },
    {
        "id": "kota_banjar",
        "name": "Dinas Sosial Kota Banjar",
        "queries": [
            "Dinas Sosial Kota Banjar",
            "Jalan Siliwangi Purwaharja Banjar",
            "Dinas Sosial Purwaharja Banjar"
        ]
    },
    {
        "id": "kab_pangandaran",
        "name": "Dinas Sosial Kabupaten Pangandaran",
        "queries": [
            "Dinas Sosial PMD Kabupaten Pangandaran",
            "Dinas Sosial Pangandaran",
            "Jalan Raya Cijulang Parigi Pangandaran"
        ]
    },
    {
        "id": "kab_sumedang",
        "name": "Dinas Sosial Kabupaten Sumedang",
        "queries": [
            "Dinas Sosial Kabupaten Sumedang",
            "Jalan Mayor Abdurahman No. 200 Sumedang",
            "Dinas Sosial Kotakaler Sumedang"
        ]
    },
    {
        "id": "kab_indramayu",
        "name": "Dinas Sosial Kabupaten Indramayu",
        "queries": [
            "Dinas Sosial Kabupaten Indramayu",
            "Jalan Pabean Udik Indramayu",
            "Dinas Sosial Indramayu"
        ]
    },
    {
        "id": "kab_cirebon",
        "name": "Dinas Sosial Kabupaten Cirebon",
        "queries": [
            "Dinas Sosial Kabupaten Cirebon",
            "Jalan Sunan Drajat No. 16 Sumber Cirebon",
            "Dinas Sosial Sumber Cirebon"
        ]
    },
    {
        "id": "kota_cirebon",
        "name": "Dinas Sosial Kota Cirebon",
        "queries": [
            "Dinas Sosial Kota Cirebon",
            "Jalan Brigjen Dharsono No. 5 Sunyaragi Kesambi Cirebon",
            "Dinas Sosial Kesambi Cirebon"
        ]
    },
    {
        "id": "kab_majalengka",
        "name": "Dinas Sosial Kabupaten Majalengka",
        "queries": [
            "Dinas Sosial Kabupaten Majalengka",
            "Jalan Raya KH. Abdul Halim Cigasong Majalengka",
            "Dinas Sosial Cigasong Majalengka"
        ]
    },
    {
        "id": "kab_kuningan",
        "name": "Dinas Sosial Kabupaten Kuningan",
        "queries": [
            "Dinas Sosial Kabupaten Kuningan",
            "Jalan Pramuka Purwawinangun Kuningan",
            "Dinas Sosial Kuningan"
        ]
    }
]

results = {}

for item in offices_data:
    oid = item["id"]
    found = False
    for q_text in item["queries"]:
        q = urllib.parse.quote(q_text)
        url = f"https://nominatim.openstreetmap.org/search?q={q}&countrycodes=id&format=json&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "DinsosJabarAuditor/1.0 (contact: info@jabarprov.go.id)"})
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                if data:
                    lat = float(data[0]["lat"])
                    lon = float(data[0]["lon"])
                    display = data[0].get("display_name", "")
                    osm_type = data[0].get("osm_type", "")
                    osm_id = data[0].get("osm_id", "")
                    print(f"[{oid}] FOUND via '{q_text}': lat={lat}, lon={lon}, osm={osm_type}/{osm_id}")
                    results[oid] = {
                        "lat": round(lat, 5),
                        "lng": round(lon, 5),
                        "display_name": display,
                        "osm": f"{osm_type}/{osm_id}",
                        "query_used": q_text
                    }
                    found = True
                    break
        except Exception as e:
            print(f"[{oid}] Query error '{q_text}': {e}", file=sys.stderr)
        time.sleep(1.05)
    
    if not found:
        print(f"[{oid}] NOT FOUND in any query")

with open("/tmp/osm_dinsos_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nDone! Results saved to /tmp/osm_dinsos_results.json")
