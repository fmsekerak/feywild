-- Feywild D1 foundation (SQLite). Run on the NEW empty D1 database only.
-- Existing Supabase remains the live data source until migration is verified.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS characters (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL UNIQUE,
 portrait_url TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS item_catalog (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 category TEXT NOT NULL DEFAULT '',
 rarity TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS inventory_items (
 id TEXT PRIMARY KEY,
 character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
 catalog_item_id TEXT REFERENCES item_catalog(id) ON DELETE SET NULL,
 name TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 quantity INTEGER NOT NULL CHECK(quantity BETWEEN 0 AND 999999),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_inventory_character ON inventory_items(character_id);

-- Append-only audit log: includes enough before/after data to reconstruct changes.
-- Never expose this table through player-facing API routes.
CREATE TABLE IF NOT EXISTS inventory_history (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 character_id TEXT NOT NULL,
 item_id TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('added','changed','removed')),
 item_name TEXT NOT NULL,
 old_quantity INTEGER,
 new_quantity INTEGER,
 old_snapshot TEXT,
 new_snapshot TEXT,
 changed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_history_character_date ON inventory_history(character_id,changed_at);

CREATE TRIGGER IF NOT EXISTS inventory_log_insert AFTER INSERT ON inventory_items
BEGIN
 INSERT INTO inventory_history(character_id,item_id,action,item_name,old_quantity,new_quantity,new_snapshot)
 VALUES(NEW.character_id,NEW.id,'added',NEW.name,NULL,NEW.quantity,
 json_object('id',NEW.id,'character_id',NEW.character_id,'catalog_item_id',NEW.catalog_item_id,'name',NEW.name,'description',NEW.description,'quantity',NEW.quantity));
END;
CREATE TRIGGER IF NOT EXISTS inventory_log_update AFTER UPDATE ON inventory_items
WHEN OLD.quantity IS NOT NEW.quantity OR OLD.name IS NOT NEW.name OR OLD.description IS NOT NEW.description OR OLD.catalog_item_id IS NOT NEW.catalog_item_id OR OLD.character_id IS NOT NEW.character_id
BEGIN
 INSERT INTO inventory_history(character_id,item_id,action,item_name,old_quantity,new_quantity,old_snapshot,new_snapshot)
 VALUES(NEW.character_id,NEW.id,'changed',NEW.name,OLD.quantity,NEW.quantity,
 json_object('id',OLD.id,'character_id',OLD.character_id,'catalog_item_id',OLD.catalog_item_id,'name',OLD.name,'description',OLD.description,'quantity',OLD.quantity),
 json_object('id',NEW.id,'character_id',NEW.character_id,'catalog_item_id',NEW.catalog_item_id,'name',NEW.name,'description',NEW.description,'quantity',NEW.quantity));
END;
CREATE TRIGGER IF NOT EXISTS inventory_log_delete AFTER DELETE ON inventory_items
BEGIN
 INSERT INTO inventory_history(character_id,item_id,action,item_name,old_quantity,new_quantity,old_snapshot)
 VALUES(OLD.character_id,OLD.id,'removed',OLD.name,OLD.quantity,NULL,
 json_object('id',OLD.id,'character_id',OLD.character_id,'catalog_item_id',OLD.catalog_item_id,'name',OLD.name,'description',OLD.description,'quantity',OLD.quantity));
END;

-- Future character sheets and campaign notes. Authorization MUST be enforced
-- by Pages Functions; selecting DM in sessionStorage is not authentication.
CREATE TABLE IF NOT EXISTS character_data (
 character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE RESTRICT,
 section TEXT NOT NULL,
 data_json TEXT NOT NULL CHECK(json_valid(data_json)),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 PRIMARY KEY(character_id,section)
);
CREATE TABLE IF NOT EXISTS campaign_entries (
 id TEXT PRIMARY KEY,
 entry_type TEXT NOT NULL CHECK(entry_type IN ('session','quest','npc','location','lore','note','encounter')),
 title TEXT NOT NULL,
 body TEXT NOT NULL DEFAULT '',
 metadata_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(metadata_json)),
 is_dm_only INTEGER NOT NULL DEFAULT 1 CHECK(is_dm_only IN (0,1)),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
