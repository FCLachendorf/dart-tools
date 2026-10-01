# Automatischer Teamvergleich

Die Standardligen stehen zentral in `data/3k-leagues.json`. Beim Saisonwechsel
für A und B die Event-ID und bei Bedarf den exakten 3K-Mannschaftsnamen ändern.
Website und stündliche Sicherung verwenden diese Datei. Gegner werden aus der
Teilnehmerliste geladen; bekannte Namen behalten ihre Vereinslogos und Adressen.
Neue Gegner können noch kein hinterlegtes Logo bzw. keine Adresse haben.

Ein manuell gespeicherter Liga-Link überschreibt die zentrale Einstellung nur in
diesem Browser. Vor dem Speichern muss das eigene Team eindeutig gefunden werden.
„Standard“ entfernt die lokale Ausnahme. Neue Standardligen für alle Geräte
müssen in der zentralen Datei geändert werden, damit die Sicherung sie erfasst.

Live-Daten kommen von 3K. Als Ausfallsicherung lädt die Website die kleine JSON-Datei
direkt von `raw.githubusercontent.com/FCLachendorf/dart-tools/main/data/3k-cache.json`.
Dadurch werden Bot-Updates auch ohne erneuten GitHub-Pages-Build sichtbar.
Die mit der Website veröffentlichte Kopie und der letzte lokale Stand bleiben
weitere Ausweichmöglichkeiten. Abrufe haben Zeitlimits; Tabellen und Bestleistungen
werden nach ihren jeweiligen Prüfzeitpunkten zusammengeführt. Unbekannt bleibt
leer, eine bestätigte Null bleibt Null. Alte Bestleistungen werden gekennzeichnet.

Die GitHub-Aktion speichert erfolgreiche Teilabrufe und meldet unvollständige
Aktualisierungen als fehlgeschlagen. Der letzte gültige Stand bleibt erhalten.
`checkedAt` bezeichnet eine erfolgreiche Tabellenprüfung, `performanceCheckedAt`
eine erfolgreiche Prüfung der Bestleistungen des jeweiligen Teams.

`proxyBase` kann optional auf einen tatsächlich bereitgestellten HTTPS-Endpunkt
zeigen. Ein zusätzlicher Hostingdienst ist für die Sicherung nicht erforderlich.
Zeitpläne und externe Dienste können verzögert oder ausgefallen sein; die Anzeige
des Datenstands ist daher maßgeblich, nicht eine garantierte stündliche Aktualität.

Prüfung: `node --test tests/*.test.cjs` und
`python -m unittest discover -s tests -p "test_*.py"`.
