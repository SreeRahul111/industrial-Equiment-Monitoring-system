import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models.user import User, UserRole
from backend.app.models.machine import Machine, MachineStatus
from backend.app.models.threshold import Threshold
from backend.app.security.hashing import get_password_hash
from backend.app.security.jwt import create_access_token

# Test database in memory
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_admin_user(db_session):
    user = User(
        email="test_admin@iems.industrial",
        password_hash=get_password_hash("AdminPass123!"),
        name="Admin User",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_engineer_user(db_session):
    user = User(
        email="test_engineer@company.com",
        password_hash=get_password_hash("EngPass123!"),
        name="Engineer User",
        role=UserRole.ENGINEER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_viewer_user(db_session):
    user = User(
        email="test_viewer@company.com",
        password_hash=get_password_hash("ViewerPass123!"),
        name="Viewer User",
        role=UserRole.VIEWER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def admin_token(test_admin_user):
    return create_access_token(test_admin_user.id, test_admin_user.role.value)

@pytest.fixture
def engineer_token(test_engineer_user):
    return create_access_token(test_engineer_user.id, test_engineer_user.role.value)

@pytest.fixture
def viewer_token(test_viewer_user):
    return create_access_token(test_viewer_user.id, test_viewer_user.role.value)

@pytest.fixture
def test_machine(db_session):
    machine = Machine(
        machine_code="TST-101",
        name="Test Industrial Compressor",
        location="Line X",
        status=MachineStatus.NORMAL
    )
    db_session.add(machine)
    db_session.commit()
    db_session.refresh(machine)

    threshold = Threshold(
        machine_id=machine.id,
        temperature_min=10.0,
        temperature_max=90.0,
        pressure_min=1.0,
        pressure_max=8.0,
        vibration_max=6.0,
        power_min=5.0,
        power_max=80.0,
        version=1,
        created_by="system"
    )
    db_session.add(threshold)
    db_session.commit()
    return machine
