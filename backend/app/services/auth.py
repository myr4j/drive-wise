"""
service d'authentification pour les chauffeurs

gère:
- création de compte (register)
- connexion (login) avec vérification du mot de passe haché
"""
from typing import Optional

from app.models.driver import Driver


def authenticate_driver(db, email: str, password: str) -> Optional[Driver]:
    """
    authentifie un chauffeur par email et mot de passe.
    
    args:
        db: session de base de données
        email: email du chauffeur
        password: mot de passe en clair
    
    returns:
        objet Driver si authentification réussie, None sinon
    """
    driver = db.query(Driver).filter(Driver.email == email).first()
    
    if not driver:
        return None
    
    if not driver.verify_password(password):
        return None
    
    if not driver.is_active:
        return None
    
    return driver


def create_driver(db, email: str, username: str, password: str) -> Driver:
    """
    crée un nouveau chauffeur avec mot de passe haché.
    
    args:
        db: session de base de données
        email: email du chauffeur (doit être unique)
        username: nom d'utilisateur (doit être unique)
        password: mot de passe en clair
    
    returns:
        objet Driver créé
    
    raises:
        ValueError: si l'email ou le username existe déjà
    """
    # vérifie si l'email existe déjà
    existing = db.query(Driver).filter(
        (Driver.email == email) | (Driver.username == username)
    ).first()
    
    if existing:
        if existing.email == email:
            raise ValueError("cet email est déjà utilisé")
        if existing.username == username:
            raise ValueError("ce nom d'utilisateur est déjà utilisé")
    
    # crée le chauffeur avec mot de passe haché
    driver = Driver(
        email=email,
        username=username,
        hashed_password=Driver.hash_password(password),
    )
    
    db.add(driver)
    db.commit()
    db.refresh(driver)
    
    return driver
