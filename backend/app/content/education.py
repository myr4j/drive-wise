"""
Contenu éducatif sur la fatigue au volant.
Miroir du fichier frontend/src/content/education.ts + advice.ts, exposé en
français pour injection dans le system prompt du chatbot.
"""

EDUCATION_CARDS = [
    {
        "title": "Reconnaître la fatigue",
        "body": "La fatigue au volant se manifeste avant que le conducteur ne s'en rende compte. Les signaux précoces incluent bâillements fréquents, yeux lourds, difficultés à maintenir la trajectoire et pensées qui vagabondent.",
    },
    {
        "title": "L'importance des pauses",
        "body": "Une pause de 15 à 20 min toutes les 2h de conduite est recommandée, même sans fatigue ressentie. Sortir du véhicule et marcher quelques minutes aide. Éviter de conduire plus de 8h par jour.",
    },
    {
        "title": "Rythme circadien",
        "body": "La vigilance fluctue naturellement : creux entre 2h et 5h du matin (vigilance au plus bas) et creux post-déjeuner de 13h à 15h (vigilance réduite d'environ 30%). Planifier les trajets importants le matin.",
    },
    {
        "title": "Hydratation et vigilance",
        "body": "Une déshydratation légère (1 à 2%) suffit à réduire la concentration et allonger le temps de réaction. Boire 1,5 à 2L d'eau par jour de travail. Éviter les boissons sucrées qui entraînent des pics d'énergie. Un verre d'eau toutes les heures de conduite.",
    },
    {
        "title": "Nutrition avant de conduire",
        "body": "Les repas lourds favorisent l'endormissement en déviant le sang vers la digestion. Privilégier des repas légers et équilibrés, éviter l'alcool même en faible quantité, et privilégier fruits et protéines qui maintiennent l'énergie stable.",
    },
    {
        "title": "La dette de sommeil",
        "body": "Dormir 6h au lieu de 8h crée une dette qui s'accumule. Après 5 jours, la réactivité au volant équivaut à 0,5g d'alcool dans le sang. Viser 7 à 9h de sommeil par nuit. Une sieste de 20 min peut remplacer 2h de sommeil manqué.",
    },
]

PRE_SHIFT_TIPS = [
    "Dormir au moins 7h avant le service pour un départ en forme.",
    "S'hydrater avant de prendre le volant — un verre d'eau suffit.",
    "Éviter les repas trop lourds juste avant de démarrer.",
    "Étirer épaules et nuque 2 minutes avant de partir.",
    "Prévoir les pauses à l'avance — une toutes les 2h minimum.",
    "Vérifier que l'habitacle est bien ventilé pour rester alerte.",
]

POST_SHIFT_TIPS = [
    "Prendre quelques minutes de marche avant de rentrer chez soi.",
    "Manger un repas léger pour récupérer sans alourdir la digestion.",
    "Éviter les écrans au moins 30 min avant de dormir.",
    "Noter le ressenti de la journée — cela aide à ajuster son rythme.",
    "Un étirement du dos après une longue session aide à décompresser.",
    "S'hydrater en fin de journée — la conduite déshydrate.",
]


def build_education_block() -> str:
    """Construit le bloc texte injecté en system prompt."""
    lines = ["# Connaissances sur la fatigue au volant", ""]
    for card in EDUCATION_CARDS:
        lines.append(f"## {card['title']}")
        lines.append(card["body"])
        lines.append("")

    lines.append("## Conseils avant un trajet")
    for tip in PRE_SHIFT_TIPS:
        lines.append(f"- {tip}")
    lines.append("")

    lines.append("## Conseils après un trajet")
    for tip in POST_SHIFT_TIPS:
        lines.append(f"- {tip}")

    return "\n".join(lines)


EDUCATION_CONTEXT = build_education_block()
