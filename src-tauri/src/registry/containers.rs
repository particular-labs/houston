//! Container service detection registry.
//!
//! Provides a single source of truth for categorizing Docker containers
//! based on their image names. This follows the same pattern as the
//! project detection registry.

use serde::{Deserialize, Serialize};

/// Container service category
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ContainerCategory {
    Database,
    Cache,
    Queue,
    Proxy,
    WebApp,
    Monitoring,
    Service,
    Unknown,
}

impl ContainerCategory {
    pub fn display_name(&self) -> &'static str {
        match self {
            ContainerCategory::Database => "Database",
            ContainerCategory::Cache => "Cache",
            ContainerCategory::Queue => "Queue",
            ContainerCategory::Proxy => "Proxy",
            ContainerCategory::WebApp => "Web App",
            ContainerCategory::Monitoring => "Monitoring",
            ContainerCategory::Service => "Service",
            ContainerCategory::Unknown => "Unknown",
        }
    }
}

/// Container detection rule
pub struct ContainerRule {
    pub name: &'static str,
    pub patterns: &'static [&'static str],
    pub category: ContainerCategory,
    pub default_port: Option<u16>,
    pub icon: &'static str,
}

/// Static registry of container detection rules.
/// Patterns are matched against the image name (case-insensitive).
pub const CONTAINER_RULES: &[ContainerRule] = &[
    // Databases
    ContainerRule {
        name: "PostgreSQL",
        patterns: &["postgres"],
        category: ContainerCategory::Database,
        default_port: Some(5432),
        icon: "database",
    },
    ContainerRule {
        name: "MySQL",
        patterns: &["mysql", "mariadb"],
        category: ContainerCategory::Database,
        default_port: Some(3306),
        icon: "database",
    },
    ContainerRule {
        name: "MongoDB",
        patterns: &["mongo"],
        category: ContainerCategory::Database,
        default_port: Some(27017),
        icon: "database",
    },
    ContainerRule {
        name: "SQLite",
        patterns: &["sqlite"],
        category: ContainerCategory::Database,
        default_port: None,
        icon: "database",
    },
    ContainerRule {
        name: "CockroachDB",
        patterns: &["cockroach"],
        category: ContainerCategory::Database,
        default_port: Some(26257),
        icon: "database",
    },
    ContainerRule {
        name: "Elasticsearch",
        patterns: &["elasticsearch", "elastic/"],
        category: ContainerCategory::Database,
        default_port: Some(9200),
        icon: "database",
    },
    ContainerRule {
        name: "ClickHouse",
        patterns: &["clickhouse"],
        category: ContainerCategory::Database,
        default_port: Some(8123),
        icon: "database",
    },
    ContainerRule {
        name: "Cassandra",
        patterns: &["cassandra"],
        category: ContainerCategory::Database,
        default_port: Some(9042),
        icon: "database",
    },
    // Cache
    ContainerRule {
        name: "Redis",
        patterns: &["redis", "keydb", "valkey", "dragonfly"],
        category: ContainerCategory::Cache,
        default_port: Some(6379),
        icon: "zap",
    },
    ContainerRule {
        name: "Memcached",
        patterns: &["memcached"],
        category: ContainerCategory::Cache,
        default_port: Some(11211),
        icon: "zap",
    },
    // Queues
    ContainerRule {
        name: "RabbitMQ",
        patterns: &["rabbitmq"],
        category: ContainerCategory::Queue,
        default_port: Some(5672),
        icon: "inbox",
    },
    ContainerRule {
        name: "Kafka",
        patterns: &["kafka", "confluent"],
        category: ContainerCategory::Queue,
        default_port: Some(9092),
        icon: "inbox",
    },
    ContainerRule {
        name: "NATS",
        patterns: &["nats"],
        category: ContainerCategory::Queue,
        default_port: Some(4222),
        icon: "inbox",
    },
    ContainerRule {
        name: "Pulsar",
        patterns: &["pulsar"],
        category: ContainerCategory::Queue,
        default_port: Some(6650),
        icon: "inbox",
    },
    // Proxies
    ContainerRule {
        name: "Nginx",
        patterns: &["nginx"],
        category: ContainerCategory::Proxy,
        default_port: Some(80),
        icon: "globe",
    },
    ContainerRule {
        name: "Traefik",
        patterns: &["traefik"],
        category: ContainerCategory::Proxy,
        default_port: Some(80),
        icon: "globe",
    },
    ContainerRule {
        name: "Caddy",
        patterns: &["caddy"],
        category: ContainerCategory::Proxy,
        default_port: Some(80),
        icon: "globe",
    },
    ContainerRule {
        name: "HAProxy",
        patterns: &["haproxy"],
        category: ContainerCategory::Proxy,
        default_port: Some(80),
        icon: "globe",
    },
    ContainerRule {
        name: "Envoy",
        patterns: &["envoy"],
        category: ContainerCategory::Proxy,
        default_port: Some(80),
        icon: "globe",
    },
    // Monitoring
    ContainerRule {
        name: "Grafana",
        patterns: &["grafana"],
        category: ContainerCategory::Monitoring,
        default_port: Some(3000),
        icon: "activity",
    },
    ContainerRule {
        name: "Prometheus",
        patterns: &["prometheus", "prom/"],
        category: ContainerCategory::Monitoring,
        default_port: Some(9090),
        icon: "activity",
    },
    ContainerRule {
        name: "Jaeger",
        patterns: &["jaeger"],
        category: ContainerCategory::Monitoring,
        default_port: Some(16686),
        icon: "activity",
    },
    ContainerRule {
        name: "Loki",
        patterns: &["loki"],
        category: ContainerCategory::Monitoring,
        default_port: Some(3100),
        icon: "activity",
    },
    ContainerRule {
        name: "Zipkin",
        patterns: &["zipkin"],
        category: ContainerCategory::Monitoring,
        default_port: Some(9411),
        icon: "activity",
    },
    // Web Apps / Services
    ContainerRule {
        name: "Portainer",
        patterns: &["portainer"],
        category: ContainerCategory::WebApp,
        default_port: Some(9000),
        icon: "layout-dashboard",
    },
    ContainerRule {
        name: "Adminer",
        patterns: &["adminer"],
        category: ContainerCategory::WebApp,
        default_port: Some(8080),
        icon: "database",
    },
    ContainerRule {
        name: "pgAdmin",
        patterns: &["pgadmin", "dpage/pgadmin"],
        category: ContainerCategory::WebApp,
        default_port: Some(80),
        icon: "database",
    },
    ContainerRule {
        name: "Jupyter",
        patterns: &["jupyter"],
        category: ContainerCategory::WebApp,
        default_port: Some(8888),
        icon: "book-open",
    },
    ContainerRule {
        name: "MinIO",
        patterns: &["minio"],
        category: ContainerCategory::Service,
        default_port: Some(9000),
        icon: "hard-drive",
    },
    ContainerRule {
        name: "Vault",
        patterns: &["vault"],
        category: ContainerCategory::Service,
        default_port: Some(8200),
        icon: "lock",
    },
    ContainerRule {
        name: "Consul",
        patterns: &["consul"],
        category: ContainerCategory::Service,
        default_port: Some(8500),
        icon: "network",
    },
    // AI/ML Services
    ContainerRule {
        name: "Ollama",
        patterns: &["ollama"],
        category: ContainerCategory::Service,
        default_port: Some(11434),
        icon: "brain",
    },
    ContainerRule {
        name: "LocalAI",
        patterns: &["localai"],
        category: ContainerCategory::Service,
        default_port: Some(8080),
        icon: "brain",
    },
    ContainerRule {
        name: "ComfyUI",
        patterns: &["comfyui"],
        category: ContainerCategory::WebApp,
        default_port: Some(8188),
        icon: "image",
    },
    // Mail
    ContainerRule {
        name: "Mailhog",
        patterns: &["mailhog"],
        category: ContainerCategory::Service,
        default_port: Some(8025),
        icon: "mail",
    },
    ContainerRule {
        name: "MailDev",
        patterns: &["maildev"],
        category: ContainerCategory::Service,
        default_port: Some(1080),
        icon: "mail",
    },
];

/// Result of container detection
pub struct ContainerDetection {
    pub name: String,
    pub category: ContainerCategory,
    pub icon: &'static str,
}

/// Detect container type from image name.
/// Returns the service name, category, and icon.
pub fn detect_container(image: &str) -> ContainerDetection {
    let image_lower = image.to_lowercase();

    for rule in CONTAINER_RULES {
        if rule.patterns.iter().any(|p| image_lower.contains(p)) {
            return ContainerDetection {
                name: rule.name.to_string(),
                category: rule.category,
                icon: rule.icon,
            };
        }
    }

    ContainerDetection {
        name: "Unknown".to_string(),
        category: ContainerCategory::Unknown,
        icon: "box",
    }
}

/// Detect container category from port number (fallback).
pub fn detect_category_from_port(port: u16) -> Option<(&'static str, ContainerCategory)> {
    for rule in CONTAINER_RULES {
        if rule.default_port == Some(port) {
            return Some((rule.name, rule.category));
        }
    }
    None
}

/// Check if container image is a web app (has UI).
pub fn is_web_app(image: &str) -> bool {
    let detection = detect_container(image);
    matches!(
        detection.category,
        ContainerCategory::WebApp | ContainerCategory::Monitoring
    ) || detection.name == "pgAdmin"
        || detection.name == "Adminer"
        || detection.name == "RabbitMQ" // Has management UI
        || detection.name == "Portainer"
}
