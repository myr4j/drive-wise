---
theme: default
title: DriveWise, Compagnon IA anti-fatigue
class: text-center
transition: slide-left
mdc: true
fonts:
  sans: "Inter"
---

<style>
:root {
  --dw-accent: #3563D4;
  --dw-accent-dark: #2448A8;
  --dw-accent-soft: #DAE5F8;
  --dw-bg: #F0F4FA;
  --dw-card: #FFFFFF;
  --dw-ink: #0A1628;
  --dw-ink-muted: #4A5A72;
  --dw-ink-subtle: #8A9BB5;
  --dw-hairline: rgba(10, 22, 40, 0.08);
  --dw-success: #2A9E82;
  --dw-warning: #C49A2A;
  --dw-alert: #C85A3A;
  --dw-stop: #A02828;
}
.slidev-layout { background: var(--dw-bg); color: var(--dw-ink); font-family: 'Inter', system-ui, sans-serif; }
.slidev-layout h1 { color: var(--dw-ink); font-weight: 800; letter-spacing: -0.02em; }
.slidev-layout h2, .slidev-layout h3 { color: var(--dw-ink); font-weight: 700; }
.slidev-layout a { color: var(--dw-accent); }
.accent { color: var(--dw-accent); }
.muted { color: var(--dw-ink-muted); }
.subtle { color: var(--dw-ink-subtle); }
.dw-card { background: var(--dw-card); border-radius: 12px; padding: 0.85rem 1rem; box-shadow: 0 1px 3px rgba(10,22,40,0.05); border: 1px solid var(--dw-hairline); }
.dw-card-accent { background: var(--dw-card); border-left: 3px solid var(--dw-accent); border-radius: 8px; padding: 0.7rem 0.9rem; box-shadow: 0 1px 3px rgba(10,22,40,0.05); }
.dw-label { font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.09em; color: var(--dw-accent); font-weight: 700; }
.dw-badge { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px; background: var(--dw-accent-soft); color: var(--dw-accent-dark); font-size: 0.7rem; font-weight: 600; margin-right: 0.35rem; margin-bottom: 0.35rem; }
.dw-divider { height: 1px; background: var(--dw-hairline); margin: 0.6rem 0; }
.dw-kpi { background: var(--dw-card); border-radius: 12px; padding: 1rem 0.75rem; border-top: 3px solid var(--dw-accent); text-align: center; box-shadow: 0 1px 3px rgba(10,22,40,0.06); }
.dw-kpi .v { font-size: 1.8rem; font-weight: 800; color: var(--dw-ink); line-height: 1.1; }
.dw-kpi .l { font-size: 0.65rem; color: var(--dw-ink-muted); margin-top: 0.3rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600; }
.dw-icon-pill { width: 36px; height: 36px; border-radius: 10px; background: var(--dw-accent-soft); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
.dw-quote { font-style: italic; color: var(--dw-ink-muted); }
.dw-phone { display: inline-block; background: #0A1628; border-radius: 26px; padding: 16px 6px 6px; box-shadow: 0 10px 26px rgba(10,22,40,0.22); position: relative; }
.dw-phone::before { content: ''; position: absolute; top: 7px; left: 50%; transform: translateX(-50%); width: 58px; height: 5px; background: #38445E; border-radius: 3px; }
.dw-phone img { display: block; width: auto; border-radius: 4px 4px 20px 20px; }
.dw-phone-cap { text-align: center; font-size: 0.72rem; color: var(--dw-ink-muted); margin-top: 0.5rem; font-weight: 600; }
</style>

<div class="flex justify-center mb-4">
  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b4/Logo_Universit%C3%A9_Paris_1_Panth%C3%A9on-Sorbonne_2024.svg" style="height: 56px; object-fit: contain;" />
</div>

<div style="font-size: 4.5rem; font-weight: 800; letter-spacing: -0.03em;">DriveWise</div>

<div class="text-xl mt-3 muted">
Compagnon mobile IA contre la fatigue au volant
</div>

<div class="mt-12 subtle text-sm">Projet tutoré · 2025-2026</div>
<div class="mt-2 subtle text-xs">Hamitouche · Ouar · Tagnit Hammou · Bendjelili · Krattli</div>

---
layout: default
---

# L'équipe

<div class="grid grid-cols-2 gap-6 mt-6">

<div>
<div class="dw-label mb-2">MOA, cadrage métier, besoins, recette</div>
<div class="dw-card mb-3">
<div class="font-bold text-base">Yanis Hamitouche</div>
<div class="muted text-sm">Chef de projet</div>
</div>
<div class="dw-card">
<div class="font-bold text-base">Abderrahim Ouar</div>
<div class="muted text-sm">Business analyst</div>
</div>
</div>

<div>
<div class="dw-label mb-2">MOE, architecture, code, ML, mobile</div>
<div class="dw-card mb-3">
<div class="font-bold text-base">Myriem Tagnit Hammou</div>
<div class="muted text-sm">Développeuse backend</div>
</div>
<div class="dw-card mb-3">
<div class="font-bold text-base">Nadjm Bendjelili</div>
<div class="muted text-sm">Développeur IA / ML</div>
</div>
<div class="dw-card">
<div class="font-bold text-base">Raphael Krattli</div>
<div class="muted text-sm">Développeur frontend</div>
</div>
</div>

</div>

---
layout: default
---

# Le partenaire

<div class="grid grid-cols-2 gap-8 mt-4">

<div>
<div class="dw-label mb-3">Sponsor terrain</div>
<div style="font-size: 2.4rem; font-weight: 800; letter-spacing: -0.02em;">Samir</div>
<div class="muted mt-1">Chauffeur de taxi</div>
<div class="mt-6 dw-card-accent">
<div class="text-sm" style="font-style: italic; line-height: 1.7;">
« Parfois je fais 10, 12 heures au volant. Au bout d'un moment, je sais plus si je suis encore en forme ou si je roule par habitude. J'aimerais juste qu'un truc me dise »
</div>
</div>
</div>

<div>
<div class="dw-label mb-3">Du terrain à un produit</div>
<div class="text-base"><strong>Extension aux chauffeurs professionnels</strong></div>
<div class="mt-6">
<span class="dw-badge">VTC indépendants</span>
<span class="dw-badge">Flottes</span>
<span class="dw-badge">Taxis</span>
<span class="dw-badge">Livraison longue distance</span>
</div>
<div class="mt-6 text-xs subtle">Sponsor terrain → cible élargie pour un produit commercialisable.</div>
</div>

</div>

---
layout: statement
class: text-center
---

<div style="font-size: 2.6rem; font-weight: 800; line-height: 1.15; letter-spacing: -0.02em;">
La fatigue est la <span class="accent">première cause</span> d'accident chez les conducteurs professionnels.
</div>

<div class="mt-8 text-xs subtle">
Source : Sécurité Routière / ONISR, la somnolence est impliquée dans 1 accident mortel sur 3 sur autoroute.
</div>

---
layout: default
---

# Objectifs du projet

<div class="grid grid-cols-4 gap-4 mt-8">

<div class="dw-card">
<div class="dw-icon-pill mb-3">🎯</div>
<div class="font-bold">Prédire</div>
<div class="text-sm muted mt-2">Estimer un score de fatigue en temps réel à partir de signaux objectifs de conduite.</div>
</div>

<div class="dw-card">
<div class="dw-icon-pill mb-3">💡</div>
<div class="font-bold">Suggérer</div>
<div class="text-sm muted mt-2">Envoyer des conseils bienveillants, jamais autoritaires, au bon moment.</div>
</div>

<div class="dw-card">
<div class="dw-icon-pill mb-3">🔍</div>
<div class="font-bold">Expliquer</div>
<div class="text-sm muted mt-2">Rendre chaque prédiction lisible, pas une boîte noire.</div>
</div>

<div class="dw-card">
<div class="dw-icon-pill mb-3">🛡️</div>
<div class="font-bold">Respecter</div>
<div class="text-sm muted mt-2">Conformité RGPD, données conducteur, zéro surveillance patronale.</div>
</div>

</div>

---
layout: default
---

# Fonctionnalités utilisateur

<div class="grid grid-cols-3 gap-3 mt-6">

<div class="dw-card"><div class="dw-icon-pill mb-2">🚦</div><div class="font-bold text-sm">Démarrer un trajet</div><div class="text-xs muted mt-1">Un tap depuis le dashboard, permission GPS demandée une seule fois.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">📊</div><div class="font-bold text-sm">Jauge de fatigue</div><div class="text-xs muted mt-1">Score 0 à 1 en continu, code couleur, niveau lisible.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">💡</div><div class="font-bold text-sm">Conseils bienveillants</div><div class="text-xs muted mt-1">Messages courts en français, jamais autoritaires.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">🔍</div><div class="font-bold text-sm">Comprendre le score</div><div class="text-xs muted mt-1">Facteurs qui augmentent ou réduisent la fatigue.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">💬</div><div class="font-bold text-sm">Assistant conversationnel</div><div class="text-xs muted mt-1">Chatbot IA qui répond sur la fatigue et tes statistiques personnelles.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">📈</div><div class="font-bold text-sm">Historique et stats</div><div class="text-xs muted mt-1">Tendance 7 jours, indicateurs globaux, liste des trajets.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">🔔</div><div class="font-bold text-sm">Notifications</div><div class="text-xs muted mt-1">Rappels début et fin, mode discret, personnalisation.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">🛡️</div><div class="font-bold text-sm">Vie privée</div><div class="text-xs muted mt-1">Consentement, export JSON, suppression, pauses manuelles.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">⭐</div><div class="font-bold text-sm">Notation et feedback</div><div class="text-xs muted mt-1">Note des suggestions, contestation, feedback in-app.</div></div>

</div>

<div class="mt-6 text-center text-sm subtle">
Toutes les données restent sur le téléphone du conducteur, aucune information n'est partagée avec un employeur.
</div>

---
layout: default
---

# Périmetre technique

<div class="grid grid-cols-5 gap-2 mt-6">

<div class="dw-card" style="border-top: 3px solid var(--dw-accent);">
<div class="dw-label">ÉTAPE 1</div>
<div class="font-bold mt-1">Capter</div>
<div class="text-xs muted mt-2">Le mobile envoie un snapshot GPS toutes les 30 s : vitesse, latitude, longitude, timestamp.</div>
</div>

<div class="dw-card" style="border-top: 3px solid var(--dw-accent);">
<div class="dw-label">ÉTAPE 2</div>
<div class="font-bold mt-1">Agréger</div>
<div class="text-xs muted mt-2">Le backend calcule 10 features : durée du trajet, temps depuis la dernière pause, ratio de conduite, indicateurs circadiens.</div>
</div>

<div class="dw-card" style="border-top: 3px solid var(--dw-accent);">
<div class="dw-label">ÉTAPE 3</div>
<div class="font-bold mt-1">Prédire</div>
<div class="text-xs muted mt-2">XGBoost prédit un score entre 0 et 1, mappé sur un niveau (faible, modéré, élevé, critique).</div>
</div>

<div class="dw-card" style="border-top: 3px solid var(--dw-accent);">
<div class="dw-label">ÉTAPE 4</div>
<div class="font-bold mt-1">Expliquer</div>
<div class="text-xs muted mt-2">SHAP attribue à chaque feature sa contribution au score, top facteurs positifs et négatifs.</div>
</div>

<div class="dw-card" style="border-top: 3px solid var(--dw-accent);">
<div class="dw-label">ÉTAPE 5</div>
<div class="font-bold mt-1">Conseiller</div>
<div class="text-xs muted mt-2">Si seuil franchi et cooldown 30 min respecté, Groq Llama 3.2 génère un message court, sinon fallback codé en dur.</div>
</div>

</div>

<div class="mt-6 dw-card-accent">
<div class="text-sm muted">Chaque snapshot déclenche cette boucle complète en quelques centaines de millisecondes. Tout vit dans une seule API FastAPI, le modèle XGBoost est chargé en mémoire au démarrage du serveur.</div>
</div>

---
layout: default
---

# Assistant conversationnel

<div class="text-base muted mt-3">Un chatbot intégré à l'app qui répond aux questions du conducteur sur sa fatigue et ses statistiques personnelles.</div>

<div class="grid grid-cols-3 gap-4 mt-8">
<div class="dw-card"><div class="dw-icon-pill mb-3">🎯</div><div class="font-bold">Contexte personnalisé</div><div class="text-sm mt-2 muted">Le profil du conducteur (5 derniers trajets, scores, pauses) est injecté dans le prompt. L'assistant cite ses vrais chiffres, n'en invente jamais.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-3">📚</div><div class="font-bold">Base de connaissances</div><div class="text-sm mt-2 muted">6 thèmes sur la fatigue (sommeil, pauses, rythme circadien, hydratation…) ancrent les réponses dans des conseils fiables.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-3">🛡️</div><div class="font-bold">Garde-fous</div><div class="text-sm mt-2 muted">Reste dans son domaine, jamais de diagnostic médical, ton bienveillant, mémoire glissante de 10 messages.</div></div>
</div>

<div class="mt-8 text-center text-xs subtle">
Groq · Llama 3.3 70B · réponses en français, repli sur un message d'attente si le service est hors-ligne.
</div>

---
layout: default
---

# DriveWise, positionnement

<div class="grid grid-cols-2 gap-6 mt-3">

<div>
<div class="dw-label mb-3" style="color: var(--dw-stop);">CE QUE CE N'EST PAS</div>
<div class="space-y-2">
<div class="dw-card" style="border-left: 3px solid var(--dw-stop);"><div class="text-sm">Un traceur GPS intrusif</div></div>
<div class="dw-card" style="border-left: 3px solid var(--dw-stop);"><div class="text-sm">Un outil de surveillance patronale</div></div>
<div class="dw-card" style="border-left: 3px solid var(--dw-stop);"><div class="text-sm">Un optimiseur de revenus</div></div>
<div class="dw-card" style="border-left: 3px solid var(--dw-stop);"><div class="text-sm">Une boîte noire opaque</div></div>
</div>
</div>

<div>
<div class="dw-label mb-3" style="color: var(--dw-success);">CE QUE CE EST</div>
<div class="space-y-2">
<div class="dw-card" style="border-left: 3px solid var(--dw-success);"><div class="text-sm">Un compagnon de route bienveillant</div></div>
<div class="dw-card" style="border-left: 3px solid var(--dw-success);"><div class="text-sm">Une prédiction sur signaux objectifs</div></div>
<div class="dw-card" style="border-left: 3px solid var(--dw-success);"><div class="text-sm">Un conseiller suggestif, jamais autoritaire</div></div>
<div class="dw-card" style="border-left: 3px solid var(--dw-success);"><div class="text-sm">Une IA explicable via SHAP</div></div>
</div>
</div>

</div>

---
layout: default
---

# Architecture

<div class="mt-2 flex justify-center">

```mermaid {scale: 1.6}
graph LR
    A[Frontend] <--> B[Backend]
    B <--> C[Modèle ML]
    B <--> D[(BDD)]
    B <--> E[LLM]
```

</div>

---
layout: default
---

# Stack technologique

<div class="grid grid-cols-3 gap-3 mt-6">

<div class="dw-card">
<div class="dw-label">Mobile</div>
<div class="text-base font-bold mt-1">React Native + Expo 54</div>
<div class="text-xs muted mt-1">Code unique iOS / Android / Web · Zustand · React Hook Form + Zod</div>
</div>

<div class="dw-card">
<div class="dw-label">Backend</div>
<div class="text-base font-bold mt-1">FastAPI 0.115</div>
<div class="text-xs muted mt-1">Async · Pydantic v2 · OpenAPI auto · JWT + Bcrypt</div>
</div>

<div class="dw-card">
<div class="dw-label">ML</div>
<div class="text-base font-bold mt-1">XGBoost 2.1</div>
<div class="text-xs muted mt-1">10 features tabulaires · entraînement &lt; 2 s</div>
</div>

<div class="dw-card">
<div class="dw-label">Explicabilité</div>
<div class="text-base font-bold mt-1">SHAP 0.46</div>
<div class="text-xs muted mt-1">Contributions par prédiction · TreeExplainer</div>
</div>

<div class="dw-card">
<div class="dw-label">LLM</div>
<div class="text-base font-bold mt-1">Groq · Llama 3.2 / 3.3</div>
<div class="text-xs muted mt-1">Suggestions (3.2) + assistant chatbot (3.3 70B) · fallback si offline</div>
</div>

<div class="dw-card">
<div class="dw-label">Données</div>
<div class="text-base font-bold mt-1">SQLite + SQLAlchemy</div>
<div class="text-xs muted mt-1">Zéro config · suffisant pour le PoC</div>
</div>

</div>

---
layout: default
---

# Pourquoi ces choix ?

<div class="grid grid-cols-2 gap-4 mt-6">

<div class="dw-card-accent">
<strong>XGBoost plutôt qu'un réseau de neurones</strong>
<div class="text-sm mt-2 muted">Sur données tabulaires &lt; 10k features, les arbres à gradient battent systématiquement le deep learning <em>(Grinsztajn et al., 2022)</em>. Modèle &lt; 1 Mo, inférence en ms.</div>
</div>

<div class="dw-card-accent">
<strong>SHAP plutôt que feature importance</strong>
<div class="text-sm mt-2 muted">Feature importance = classement global. SHAP = explication par prédiction. Indispensable pour la confiance du conducteur.</div>
</div>

<div class="dw-card-accent">
<strong>FastAPI plutôt que Flask</strong>
<div class="text-sm mt-2 muted">Validation auto via Pydantic, docs OpenAPI, async natif. Un seul langage Python pour API + ML.</div>
</div>

<div class="dw-card-accent">
<strong>React Native plutôt que Flutter</strong>
<div class="text-sm mt-2 muted">L'équipe maîtrise TypeScript, pas Dart. Code unique iOS + Android + Web via Expo.</div>
</div>

</div>

---
layout: default
---

# Notifications et seuils

<div class="grid grid-cols-2 gap-8 mt-4">

<div>
<div class="text-base">Un conseil utile n'est pas une notification de plus.</div>
<div class="text-sm muted mt-3">Le système applique trois règles :</div>
<ul class="text-sm muted mt-2 space-y-1 list-disc pl-5">
<li>Délai minimum de <span class="accent font-bold">30 minutes</span> entre deux suggestions</li>
<li>Notification immédiate en cas d'<strong>escalade</strong> de niveau</li>
<li><strong>Aucune</strong> suggestion en niveau faible</li>
</ul>
</div>

<div class="space-y-2">
<div class="dw-card" style="border-left: 4px solid var(--dw-success);"><div class="flex justify-between items-baseline"><div class="font-bold text-sm">Faible</div><div class="text-xs muted">&lt; 0.3</div></div><div class="text-xs muted mt-1">Aucune suggestion.</div></div>
<div class="dw-card" style="border-left: 4px solid var(--dw-warning);"><div class="flex justify-between items-baseline"><div class="font-bold text-sm">Modéré</div><div class="text-xs muted">0.3 à 0.6</div></div><div class="text-xs muted mt-1">Notification in-app discrète.</div></div>
<div class="dw-card" style="border-left: 4px solid var(--dw-alert);"><div class="flex justify-between items-baseline"><div class="font-bold text-sm">Élevé</div><div class="text-xs muted">0.6 à 0.8</div></div><div class="text-xs muted mt-1">Notification push douce.</div></div>
<div class="dw-card" style="border-left: 4px solid var(--dw-stop);"><div class="flex justify-between items-baseline"><div class="font-bold text-sm">Critique</div><div class="text-xs muted">&gt; 0.8</div></div><div class="text-xs muted mt-1">Notification push forte, message court.</div></div>
</div>

</div>

---
layout: default
---

# PoC sur données synthétiques

<div class="grid grid-cols-4 gap-3 mt-6">
<div class="dw-kpi"><div class="v">10 000</div><div class="l">snapshots</div></div>
<div class="dw-kpi"><div class="v">500</div><div class="l">conducteurs simulés</div></div>
<div class="dw-kpi"><div class="v">10</div><div class="l">features modèle</div></div>
<div class="dw-kpi"><div class="v">&lt; 2 s</div><div class="l">entraînement</div></div>
</div>

<div class="grid grid-cols-2 gap-4 mt-8">

<div class="dw-card-accent" style="border-left-color: var(--dw-warning);">
<strong>Limite assumée du PoC</strong>
<div class="text-sm muted mt-2">Données synthétiques (formule paramétrée + bruit gaussien). Elles permettent de valider l'architecture, la chaîne ML et l'UX, pas la performance en production.</div>
</div>

<div class="dw-card-accent" style="border-left-color: var(--dw-success);">
<strong>Prochaine étape, données réelles</strong>
<div class="text-sm muted mt-2">Des données de conduite professionnelle authentiques permettront de ré-entraîner le modèle et d'améliorer significativement la précision des prédictions.</div>
</div>

</div>

---
layout: default
---

# Démonstration, parcours conducteur

<div class="flex justify-center items-start gap-8 mt-8">

<div class="text-center">
<div class="dw-phone"><img src="/screenshots/Dashboard.png" style="height: 366px;" /></div>
<div class="dw-phone-cap">Dashboard · démarrage du trajet</div>
</div>

<div class="text-center">
<div class="dw-phone"><img src="/screenshots/Trajet%20en%20cours.png" style="height: 366px;" /></div>
<div class="dw-phone-cap">Trajet en cours · jauge de fatigue</div>
</div>

<div class="text-center">
<div class="dw-phone"><img src="/screenshots/Chatbot.png" style="height: 366px;" /></div>
<div class="dw-phone-cap">Assistant conversationnel</div>
</div>

</div>

---
layout: default
---

# Historique &amp; statistiques

<div class="flex justify-center items-start gap-16 mt-8">

<div class="text-center">
<div class="dw-phone"><img src="/screenshots/Historique.png" style="height: 380px;" /></div>
<div class="dw-phone-cap">Historique des trajets</div>
</div>

<div class="text-center">
<div class="dw-phone"><img src="/screenshots/Statistiques.png" style="height: 380px;" /></div>
<div class="dw-phone-cap">Statistiques · tendance 7 jours</div>
</div>

</div>

---
layout: default
---

# Tests utilisateurs

<div class="grid grid-cols-3 gap-4 mt-6">

<div class="dw-card">
<div class="dw-icon-pill mb-2">👥</div>
<div class="dw-label">QUI A TESTÉ ?</div>
<ul class="text-sm mt-2 space-y-1 muted">
<li><strong style="color: var(--dw-ink);">Samir</strong>, chauffeur taxi, sponsor terrain</li>
<li>L'équipe en recette interne</li>
</ul>
</div>

<div class="dw-card">
<div class="dw-icon-pill mb-2">🧪</div>
<div class="dw-label">COMMENT ?</div>
<ul class="text-sm mt-2 space-y-1 muted">
<li>Cahier de recette sur <strong style="color: var(--dw-ink);">Notion</strong></li>
<li>Cas de test dérivés du Product Backlog</li>
<li>Sessions Expo Go sur Android physique</li>
<li>Statuts OK / KO / Bloqué / N/A</li>
</ul>
</div>

<div class="dw-card">
<div class="dw-icon-pill mb-2">🎯</div>
<div class="dw-label">PÉRIMÈTRE COUVERT</div>
<div class="mt-2 flex flex-wrap">
<span class="dw-badge">Auth</span>
<span class="dw-badge">RGPD</span>
<span class="dw-badge">Cycle trajet</span>
<span class="dw-badge">Score fatigue</span>
<span class="dw-badge">Anti-harcèlement</span>
<span class="dw-badge">Notifications</span>
<span class="dw-badge">Historique</span>
<span class="dw-badge">Hors-ligne</span>
</div>
</div>

</div>

<div class="mt-6 dw-card-accent">
<div class="text-sm dw-quote">« Les conseils étaient trop fréquents en début de soirée. Avec le délai de 30 min ajouté, c'est nickel, ça reste utile sans devenir lourd. »</div>
<div class="text-xs accent font-bold mt-2">Samir, après la deuxième série de tests</div>
</div>

---
layout: default
---

# Retours et ajustements

<div class="grid grid-cols-3 gap-4 mt-6">

<div class="dw-card">
<div class="dw-label" style="color: var(--dw-ink-muted);">RETOUR TERRAIN</div>
<div class="text-sm mt-2 dw-quote">« Les messages étaient trop fréquents en début de soirée. »</div>
<div class="dw-label mt-3">AJUSTEMENT</div>
<div class="text-sm mt-2">Délai minimum de <strong>30 min</strong> entre deux suggestions + escalade prioritaire.</div>
</div>

<div class="dw-card">
<div class="dw-label" style="color: var(--dw-ink-muted);">RETOUR TERRAIN</div>
<div class="text-sm mt-2 dw-quote">« Je veux comprendre pourquoi l'app dit que je suis fatigué. »</div>
<div class="dw-label mt-3">AJUSTEMENT</div>
<div class="text-sm mt-2">Ajout de l'écran <strong>détail SHAP</strong>, top contributeurs ↑/↓ par snapshot.</div>
</div>

<div class="dw-card">
<div class="dw-label" style="color: var(--dw-ink-muted);">RETOUR TERRAIN</div>
<div class="text-sm mt-2 dw-quote">« Je veux pouvoir prendre une pause sans bouger. »</div>
<div class="dw-label mt-3">AJUSTEMENT</div>
<div class="text-sm mt-2">Bouton <strong>pause manuelle</strong> + mode discret pour les notifications.</div>
</div>

</div>

---
layout: default
---

# Bilan, livré vs prévu

<div class="space-y-2 mt-6">

<div class="grid grid-cols-12 gap-3 items-center dw-card">
<div class="col-span-2"><span class="dw-badge" style="background: var(--dw-success); color: white;">Sprint 1</span></div>
<div class="col-span-8"><div class="font-bold text-sm">Cadrage MOA + maquettes + dataset synthétique</div><div class="text-xs muted">Entretien partenaire, backlog, génération des 10k lignes.</div></div>
<div class="col-span-2 text-right text-sm"><span style="color: var(--dw-success);">✓</span> <span class="muted">Livré</span></div>
</div>

<div class="grid grid-cols-12 gap-3 items-center dw-card">
<div class="col-span-2"><span class="dw-badge" style="background: var(--dw-success); color: white;">Sprint 2</span></div>
<div class="col-span-8"><div class="font-bold text-sm">Backend FastAPI + auth + cycle trajet</div><div class="text-xs muted">Endpoints, JWT, modèles SQLAlchemy, tests pytest.</div></div>
<div class="col-span-2 text-right text-sm"><span style="color: var(--dw-success);">✓</span> <span class="muted">Livré</span></div>
</div>

<div class="grid grid-cols-12 gap-3 items-center dw-card">
<div class="col-span-2"><span class="dw-badge" style="background: var(--dw-success); color: white;">Sprint 3</span></div>
<div class="col-span-8"><div class="font-bold text-sm">ML XGBoost + SHAP + suggestions Groq</div><div class="text-xs muted">Entraînement, intégration, anti-harcèlement.</div></div>
<div class="col-span-2 text-right text-sm"><span style="color: var(--dw-success);">✓</span> <span class="muted">Livré</span></div>
</div>

<div class="grid grid-cols-12 gap-3 items-center dw-card">
<div class="col-span-2"><span class="dw-badge" style="background: var(--dw-success); color: white;">Sprint 4</span></div>
<div class="col-span-8"><div class="font-bold text-sm">Mobile React Native, écrans clés</div><div class="text-xs muted">Auth, Dashboard, Trajet, Historique, Stats.</div></div>
<div class="col-span-2 text-right text-sm"><span style="color: var(--dw-success);">✓</span> <span class="muted">Livré</span></div>
</div>

<div class="grid grid-cols-12 gap-3 items-center dw-card">
<div class="col-span-2"><span class="dw-badge" style="background: var(--dw-accent); color: white;">Sprint 5</span></div>
<div class="col-span-8"><div class="font-bold text-sm">RGPD, notifications, assistant chatbot, refonte graphique, recette</div><div class="text-xs muted">Consentement, export, mode discret, assistant conversationnel, polish UI, cahier de recette.</div></div>
<div class="col-span-2 text-right text-sm"><span class="accent">●</span> <span class="muted">En cours</span></div>
</div>

</div>

---
layout: default
---

# Difficultés et solutions

<div class="grid grid-cols-3 gap-4 mt-6">

<div class="dw-card">
<div class="text-sm font-bold" style="color: var(--dw-stop);">⚠️ Données de conduite peu accessibles</div>
<div class="text-xs muted mt-2">Les données de conduite réelles de chauffeurs professionnels sont rares, sensibles et soumises à des contraintes légales strictes.</div>
<div class="text-sm font-bold mt-3" style="color: var(--dw-success);">→ Solution</div>
<div class="text-xs muted mt-1">Dataset synthétique de 10k lignes construit à partir de la littérature scientifique sur la fatigue au volant, permettant de valider l'architecture complète.</div>
</div>

<div class="dw-card">
<div class="text-sm font-bold" style="color: var(--dw-stop);">⚠️ Risque d'app intrusive</div>
<div class="text-xs muted mt-2">Une app de fatigue peut vite ressembler à un mouchard patronal.</div>
<div class="text-sm font-bold mt-3" style="color: var(--dw-success);">→ Solution</div>
<div class="text-xs muted mt-1">Positionnement compagnon assumé dès le cadrage : aucune donnée tiers employeur, RGPD intégré au MVP.</div>
</div>

<div class="dw-card">
<div class="text-sm font-bold" style="color: var(--dw-stop);">⚠️ Coût LLM cloud</div>
<div class="text-xs muted mt-2">Génération de suggestions LLM = appel API payant à chaque snapshot.</div>
<div class="text-sm font-bold mt-3" style="color: var(--dw-success);">→ Solution</div>
<div class="text-xs muted mt-1">Groq gratuit + fallback codé en dur + délai 30 min entre suggestions = volume divisé par ~20.</div>
</div>

</div>

---
layout: default
---

# Perspectives

<div class="grid grid-cols-3 gap-3 mt-6">

<div class="dw-card"><div class="dw-icon-pill mb-2">📦</div><div class="font-bold">Données réelles</div><div class="text-sm muted mt-1">Accès à des données de conduite professionnelle pour améliorer la précision du modèle.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">🧠</div><div class="font-bold">Capteurs téléphone</div><div class="text-sm muted mt-1">Accéléromètre, gyroscope : à-coups, freinages, micro-déviations.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">🌐</div><div class="font-bold">Backend cloud</div><div class="text-sm muted mt-1">Migration SQLite → PostgreSQL + déploiement Render / Fly.io.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">👥</div><div class="font-bold">Mode flotte (opt-in)</div><div class="text-sm muted mt-1">Vue agrégée anonymisée pour gestionnaires VTC consentants.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">⌚</div><div class="font-bold">Wear OS / watchOS</div><div class="text-sm muted mt-1">Compagnon montre, vibration discrète au seuil critique.</div></div>
<div class="dw-card"><div class="dw-icon-pill mb-2">🏥</div><div class="font-bold">Partenariats santé</div><div class="text-sm muted mt-1">Médecins du travail, mutuelles, fédérations VTC.</div></div>

</div>

---
layout: center
class: text-center
---

<div style="font-size: 4.5rem; font-weight: 800; letter-spacing: -0.03em;">Merci</div>

<div class="text-xl muted mt-4">Questions ?</div>

<div class="mt-16 subtle text-sm">DriveWise · Projet tutoré · 2025-2026</div>
<div class="mt-2 subtle text-xs">Hamitouche · Ouar · Tagnit Hammou · Bendjelili · Krattli</div>
