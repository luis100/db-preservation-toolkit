package pt.gov.dgarq.roda.common.convert.db.modules.solr.out;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.embedded.EmbeddedSolrServer;
import org.apache.solr.common.SolrInputDocument;
import org.apache.solr.core.CoreContainer;

import pt.gov.dgarq.roda.common.convert.db.model.data.BinaryCell;
import pt.gov.dgarq.roda.common.convert.db.model.data.Cell;
import pt.gov.dgarq.roda.common.convert.db.model.data.Row;
import pt.gov.dgarq.roda.common.convert.db.model.data.SimpleCell;
import pt.gov.dgarq.roda.common.convert.db.model.exception.InvalidDataException;
import pt.gov.dgarq.roda.common.convert.db.model.exception.ModuleException;
import pt.gov.dgarq.roda.common.convert.db.model.exception.UnknownTypeException;
import pt.gov.dgarq.roda.common.convert.db.model.structure.CandidateKey;
import pt.gov.dgarq.roda.common.convert.db.model.structure.CheckConstraint;
import pt.gov.dgarq.roda.common.convert.db.model.structure.ColumnStructure;
import pt.gov.dgarq.roda.common.convert.db.model.structure.DatabaseStructure;
import pt.gov.dgarq.roda.common.convert.db.model.structure.ForeignKey;
import pt.gov.dgarq.roda.common.convert.db.model.structure.Parameter;
import pt.gov.dgarq.roda.common.convert.db.model.structure.PrimaryKey;
import pt.gov.dgarq.roda.common.convert.db.model.structure.PrivilegeStructure;
import pt.gov.dgarq.roda.common.convert.db.model.structure.Reference;
import pt.gov.dgarq.roda.common.convert.db.model.structure.RoleStructure;
import pt.gov.dgarq.roda.common.convert.db.model.structure.RoutineStructure;
import pt.gov.dgarq.roda.common.convert.db.model.structure.SchemaStructure;
import pt.gov.dgarq.roda.common.convert.db.model.structure.TableStructure;
import pt.gov.dgarq.roda.common.convert.db.model.structure.Trigger;
import pt.gov.dgarq.roda.common.convert.db.model.structure.UserStructure;
import pt.gov.dgarq.roda.common.convert.db.model.structure.ViewStructure;
import pt.gov.dgarq.roda.common.convert.db.modules.DatabaseHandler;

public class EmbeddedSolrExportModule implements DatabaseHandler {

	private static final Logger logger = Logger
			.getLogger(EmbeddedSolrExportModule.class);

	private static final String SOLR_HOME_FOLDER = "solr-home";

	private static final String META_PREFIX = "dbpres_meta_";

	private static final String DATA_PREFIX = "dbpres_data_";

	private static final String DATA_CORE = "data_collection";

	private static final String META_CORE = "meta_collection";

	private static final String META_ID = META_PREFIX + "id";

	private static final String META_TYPE = META_PREFIX + "type";

	private static final String META_PARENT_ID = META_PREFIX + "parent_id";

	private static final String META_PARENT_TYPE = META_PREFIX + "parent_type";

	private static final String META_KEY = META_PREFIX + "key";

	private static final String META_VALUE = META_PREFIX + "value";

	private static final String DATABASE_TYPE = "database";

	private static final String SCHEMA_TYPE = "schema";

	private static final String USER_TYPE = "user";

	private static final String ROLE_TYPE = "role";

	private static final String PRIVILEGE_TYPE = "privilege";

	private static final String TABLE_TYPE = "table";

	private static final String COLUMN_TYPE = "column";

	private static final String PRIMARY_KEY_TYPE = "primaryKey";

	private static final String PRIMARY_KEY_COLUMN_TYPE = "primaryKeyColumn";

	private static final String FOREIGN_KEY_TYPE = "foreignKey";

	private static final String REFERENCE_TYPE = "reference";

	private static final String CANDIDATE_KEY_TYPE = "candidateKey";

	private static final String CANDIDATE_KEY_COLUMN_TYPE = "candidateKeyColumn";

	private static final String CHECK_CONSTRAINT_TYPE = "checkConstraint";

	private static final String TRIGGER_TYPE = "trigger";

	private static final String ROUTINE_TYPE = "routine";

	private static final String VIEW_TYPE = "view";

	private static final String PARAMETER_TYPE = "parameter";

	private static final int FETCH_SIZE = 5000;

	private static EmbeddedSolrServer dataCoreServer;

	private static EmbeddedSolrServer metaCoreServer;

	private DatabaseStructure dbStructure;

	private TableStructure currentTableStructure;

	private Set<SolrInputDocument> currentDocs;

	private int currentCount;

	private int rowsNumber;

	public EmbeddedSolrExportModule() {
		String dir = getClass().getResource("/" + SOLR_HOME_FOLDER).getPath();
		logger.debug("dir: " + dir);
		System.setProperty("solr.solr.home", dir);
		CoreContainer coreContainer = new CoreContainer(dir);
		coreContainer.load();
		dataCoreServer = new EmbeddedSolrServer(coreContainer, DATA_CORE);
		metaCoreServer = new EmbeddedSolrServer(coreContainer, META_CORE);
		dbStructure = null;
		currentTableStructure = null;
		currentDocs = new HashSet<SolrInputDocument>();
	}

	@Override
	public void initDatabase() throws ModuleException {
		// nothing to do
	}

	@Override
	public void setIgnoredSchemas(Set<String> ignoredSchemas) {
		// nothing to do
	}

	@Override
	public void handleStructure(DatabaseStructure structure)
			throws ModuleException, UnknownTypeException {
		this.dbStructure = structure;

		exportDatabaseMeta();
		exportSchemasMeta();
		exportUsersMeta();
		exportRolesMeta();
		exportPrivilegesMeta();
	}

	private String getDatabaseId() {
		String name = (this.dbStructure.getName() != null) ? this.dbStructure
				.getName() : "default_db";
		return DATABASE_TYPE + "_" + name;
	}

	private void exportDatabaseMeta() {
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("archivalDate", this.dbStructure.getArchivalDate());
		maps.put("archiver", this.dbStructure.getArchiver());
		maps.put("archiverContact", this.dbStructure.getArchiverContact());
		maps.put("clientMachine", this.dbStructure.getClientMachine());
		maps.put("creationDate", this.dbStructure.getCreationDate());
		maps.put("databaseUser", this.dbStructure.getDatabaseUser());
		maps.put("dataOriginTimeSpan", this.dbStructure.getDataOriginTimespan());
		maps.put("dataOwner", this.dbStructure.getDataOwner());
		maps.put("description", this.dbStructure.getDescription());
		maps.put("messageDigest", this.dbStructure.getMessageDigest());
		maps.put("name", this.dbStructure.getName());
		maps.put("producerApplication",
				this.dbStructure.getProducerApplication());
		maps.put("productName", this.dbStructure.getProductName());
		maps.put("productVersion", this.dbStructure.getProductVersion());
		maps.put("url", this.dbStructure.getUrl());

		createDocs(getDatabaseId(), DATABASE_TYPE, "-", "-", maps);
	}

	private void exportSchemasMeta() {
		String idSuffix = null;
		for (SchemaStructure schema : this.dbStructure.getSchemas()) {
			idSuffix = schema.getName();
			exportSchemaStructure(schema, idSuffix, getDatabaseId());
		}
		commitDocs(metaCoreServer);
	}

	private void exportSchemaStructure(SchemaStructure schema, String idSuffix,
			String parentId) {
		String id = SCHEMA_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("name", schema.getName());
		maps.put("folder", schema.getFolder());
		maps.put("description", schema.getDescription());

		createDocs(id, SCHEMA_TYPE, parentId, DATABASE_TYPE, maps);

		exportTablesMeta(schema, idSuffix, id);
		exportViewsMeta(schema, idSuffix, id);
		exportRoutinesMeta(schema, idSuffix, id);
	}

	private void exportTablesMeta(SchemaStructure schema,
			String parentIdSuffix, String parentId) {
		String idSuffix = null;
		for (TableStructure table : schema.getTables()) {
			idSuffix = parentIdSuffix + "." + table.getName();
			exportTableStructure(table, idSuffix, parentId);
		}
	}

	private void exportTableStructure(TableStructure table, String idSuffix,
			String parentId) {
		String id = TABLE_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("id", table.getId());
		maps.put("name", table.getName());
		maps.put("folder", table.getFolder());
		maps.put("description", table.getDescription());

		createDocs(id, TABLE_TYPE, parentId, SCHEMA_TYPE, maps);

		exportColumnsMeta(table, idSuffix, id);
		exportPrimaryKeyStructure(table, idSuffix, id);
		exportForeignKeysMeta(table, idSuffix, id);
		exportCandidateKeysMeta(table, idSuffix, id);
		exportCheckConstraintsMeta(table, idSuffix, id);
		exportTriggersMeta(table, idSuffix, id);
	}

	private void exportColumnsMeta(TableStructure table, String parentIdSuffix,
			String parentId) {
		String idSuffix = null;
		for (ColumnStructure column : table.getColumns()) {
			idSuffix = parentIdSuffix + "." + column.getName();
			exportColumnStructure(column, idSuffix, parentId);
		}
	}

	private void exportColumnStructure(ColumnStructure column, String idSuffix,
			String parentId) {
		String id = COLUMN_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("id", column.getId());
		maps.put("name", column.getName());
		maps.put("folder", column.getFolder());
		maps.put("typeOriginal", column.getType().getOriginalTypeName());
		maps.put("typeSql99", column.getType().getOriginalTypeName());
		maps.put("defaultValue", column.getDefaultValue());
		maps.put("nillable", column.isNillable().toString());
		maps.put("description", column.getDescription());

		createDocs(id, COLUMN_TYPE, parentId, TABLE_TYPE, maps);
	}

	private void exportPrimaryKeyStructure(TableStructure table,
			String parentIdSuffix, String parentId) {
		String id = PRIMARY_KEY_TYPE + "_" + parentIdSuffix;
		PrimaryKey pkey = table.getPrimaryKey();
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("name", pkey.getName());
		maps.put("decription", pkey.getDescription());

		createDocs(id, PRIMARY_KEY_TYPE, parentId, TABLE_TYPE, maps);

		exportPrimaryKeyColumnsMeta(pkey, parentIdSuffix, id);
	}

	private void exportPrimaryKeyColumnsMeta(PrimaryKey pkey,
			String parentIdSuffix, String parentId) {
		int idCounter = 1;
		String idSuffix = null;
		for (String column : pkey.getColumnNames()) {
			idSuffix = parentIdSuffix + "." + idCounter;
			exportPrimaryKeyColumnStructure(column, idSuffix, parentId);
			idCounter++;
		}
	}

	private void exportPrimaryKeyColumnStructure(String column,
			String idSuffix, String parentId) {
		String id = PRIMARY_KEY_COLUMN_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("name", column);

		createDocs(id, PRIMARY_KEY_COLUMN_TYPE, parentId, PRIMARY_KEY_TYPE,
				maps);
	}

	private void exportForeignKeysMeta(TableStructure table,
			String parentIdSuffix, String parentId) {
		String idSuffix = null;
		for (ForeignKey fkey : table.getForeignKeys()) {
			idSuffix = parentIdSuffix + "." + fkey.getName();
			exportForeignKeyStructure(fkey, idSuffix, parentId);
		}
	}

	private void exportForeignKeyStructure(ForeignKey fkey, String idSuffix,
			String parentId) {
		String id = FOREIGN_KEY_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("deleteAction", fkey.getDeleteAction());
		maps.put("description", fkey.getDescription());
		maps.put("id", fkey.getId());
		maps.put("matchType", fkey.getMatchType());
		maps.put("name", fkey.getName());
		maps.put("referencedSchema", fkey.getReferencedSchema());
		maps.put("referencedTable", fkey.getReferencedTable());
		maps.put("updateAction", fkey.getUpdateAction());

		createDocs(id, FOREIGN_KEY_TYPE, parentId, TABLE_TYPE, maps);

		exportForeignKeyReferencesMeta(fkey, idSuffix, id);
	}

	private void exportForeignKeyReferencesMeta(ForeignKey fkey,
			String parentIdSuffix, String parentId) {
		int idCounter = 1;
		String idSuffix = null;
		for (Reference ref : fkey.getReferences()) {
			idSuffix = parentIdSuffix + "." + idCounter;
			exportReferenceStructure(ref, idSuffix, parentId);
			idCounter++;
		}
	}

	private void exportReferenceStructure(Reference ref, String idSuffix,
			String parentId) {
		String id = REFERENCE_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("column", ref.getColumn());
		maps.put("referenced", ref.getReferenced());

		createDocs(id, REFERENCE_TYPE, parentId, FOREIGN_KEY_TYPE, maps);
	}

	private void exportCandidateKeysMeta(TableStructure table,
			String parentIdSuffix, String parentId) {
		String idSuffix = null;
		for (CandidateKey candidate : table.getCandidateKeys()) {
			idSuffix = parentIdSuffix + "." + candidate.getName();
			exportCandidateKeyStructure(candidate, idSuffix, parentId);
		}
	}

	private void exportCandidateKeyStructure(CandidateKey candidate,
			String idSuffix, String parentId) {
		String id = CANDIDATE_KEY_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("description", candidate.getDescription());
		maps.put("name", candidate.getName());

		createDocs(id, CANDIDATE_KEY_TYPE, parentId, TABLE_TYPE, maps);

		exportCandidateColumnsMeta(candidate, idSuffix, id);
	}

	private void exportCandidateColumnsMeta(CandidateKey candidate,
			String parentIdSuffix, String parentId) {
		int idCounter = 1;
		String idSuffix = null;
		for (String col : candidate.getColumns()) {
			idSuffix = parentIdSuffix + "." + idCounter;
			exportCandidateKeyColumnStructure(col, idSuffix, parentId);
			idCounter++;
		}
	}

	private void exportCandidateKeyColumnStructure(String column,
			String idSuffix, String parentId) {
		String id = CANDIDATE_KEY_COLUMN_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("name", column);

		createDocs(id, CANDIDATE_KEY_COLUMN_TYPE, parentId, CANDIDATE_KEY_TYPE,
				maps);
	}

	private void exportCheckConstraintsMeta(TableStructure table,
			String parentIdSuffix, String parentId) {
		String idSuffix = null;
		for (CheckConstraint check : table.getCheckConstraints()) {
			idSuffix = parentIdSuffix + "." + check.getName();
			exportCheckConstraintStructure(check, idSuffix, parentId);
		}
	}

	private void exportCheckConstraintStructure(CheckConstraint check,
			String idSuffix, String parentId) {
		String id = CHECK_CONSTRAINT_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("condition", check.getCondition());
		maps.put("name", check.getName());
		maps.put("description", check.getDescription());

		createDocs(id, CHECK_CONSTRAINT_TYPE, parentId, TABLE_TYPE, maps);
	}

	private void exportTriggersMeta(TableStructure table,
			String parentIdSuffix, String parentId) {
		String idSuffix = null;
		for (Trigger trigger : table.getTriggers()) {
			idSuffix = parentIdSuffix + "." + trigger.getName();
			exportTriggerStructure(trigger, idSuffix, parentId);
		}
	}

	private void exportTriggerStructure(Trigger trigger, String idSuffix,
			String parentId) {
		String id = TRIGGER_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("actionTime", trigger.getActionTime());
		maps.put("aliasList", trigger.getAliasList());
		maps.put("description", trigger.getDescription());
		maps.put("name", trigger.getName());
		maps.put("triggeredAction", trigger.getTriggeredAction());
		maps.put("triggerEvent", trigger.getTriggerEvent());

		createDocs(id, TRIGGER_TYPE, parentId, TABLE_TYPE, maps);
	}

	private void exportRoutinesMeta(SchemaStructure schema,
			String parentIdSuffix, String parentId) {
		String idSuffix = null;
		for (RoutineStructure routine : schema.getRoutines()) {
			idSuffix = parentIdSuffix + "." + routine.getName();
			exportRoutineStructure(routine, idSuffix, parentId);
		}
	}

	private void exportRoutineStructure(RoutineStructure routine,
			String idSuffix, String parentId) {
		String id = ROUTINE_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("body", routine.getBody());
		maps.put("characteristic", routine.getCharacteristic());
		maps.put("description", routine.getDescription());
		maps.put("name", routine.getName());
		maps.put("returnType", routine.getReturnType());
		maps.put("source", routine.getSource());

		createDocs(id, ROUTINE_TYPE, parentId, SCHEMA_TYPE, maps);

		exportRoutineParametersMeta(routine, idSuffix, id);
	}

	private void exportRoutineParametersMeta(RoutineStructure routine,
			String parentIdSuffix, String parentId) {
		String idSuffix = null;
		for (Parameter parameter : routine.getParameters()) {			
			idSuffix = parentIdSuffix + "." + parameter.getName();
			exportParameterStructure(parameter, idSuffix, parentId);
		}
	}

	private void exportParameterStructure(Parameter parameter, String idSuffix,
			String parentId) {
		String id = PARAMETER_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("description", parameter.getDescription());
		maps.put("mode", parameter.getMode());
		maps.put("name", parameter.getName());
		maps.put("typeOriginal", parameter.getType().getOriginalTypeName());
		maps.put("typeSql99", parameter.getType().getSql99TypeName());

		createDocs(id, PARAMETER_TYPE, parentId, ROUTINE_TYPE, maps);
	}

	private void exportViewsMeta(SchemaStructure schema, String parentIdSuffix,
			String parentId) {
		String idSuffix = null;
		for (ViewStructure view : schema.getViews()) {
			idSuffix = parentIdSuffix + "." + view.getName();
			exportViewStructure(view, idSuffix, parentId);
		}
	}

	private void exportViewStructure(ViewStructure view, String idSuffix,
			String parentId) {
		String id = VIEW_TYPE + "_" + idSuffix;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("description", view.getDescription());
		maps.put("name", view.getName());
		maps.put("query", view.getQuery());
		maps.put("queryOriginal", view.getQueryOriginal());

		createDocs(id, VIEW_TYPE, parentId, SCHEMA_TYPE, maps);

		exportViewColumnsMeta(view, idSuffix, id);
	}

	private void exportViewColumnsMeta(ViewStructure view,
			String parentIdSuffix, String parentId) {
		String idSuffix = null;
		for (ColumnStructure column : view.getColumns()) {
			idSuffix = parentIdSuffix + "." + view.getName();
			exportColumnStructure(column, idSuffix, parentId);
		}
	}

	private void exportUsersMeta() {
		int idCounter = 1;
		for (UserStructure user : this.dbStructure.getUsers()) {
			exportUserStructure(user, idCounter, getDatabaseId());
			idCounter++;
		}
		commitDocs(metaCoreServer);
	}

	private void exportUserStructure(UserStructure user, int idCounter,
			String parentId) {
		String id = USER_TYPE + "_" + idCounter;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("name", user.getName());
		maps.put("description", user.getDescription());

		createDocs(id, USER_TYPE, parentId, DATABASE_TYPE, maps);
	}

	private void exportRolesMeta() {
		int idCounter = 1;
		for (RoleStructure role : this.dbStructure.getRoles()) {
			exportRoleStructure(role, idCounter, getDatabaseId());
			idCounter++;
		}
		commitDocs(metaCoreServer);
	}

	private void exportRoleStructure(RoleStructure role, int idCounter,
			String parentId) {
		String id = ROLE_TYPE + "_" + idCounter;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("name", role.getName());
		maps.put("admin", role.getAdmin());
		maps.put("description", role.getDescription());

		createDocs(id, ROLE_TYPE, parentId, DATABASE_TYPE, maps);
	}

	private void exportPrivilegesMeta() {
		int idCounter = 1;
		for (PrivilegeStructure privilege : this.dbStructure.getPrivileges()) {
			exportPrivilegeStructure(privilege, idCounter, getDatabaseId());
			idCounter++;
		}
		commitDocs(metaCoreServer);
	}

	private void exportPrivilegeStructure(PrivilegeStructure privilege,
			int idCounter, String parentId) {
		String id = PRIVILEGE_TYPE + "_" + idCounter;
		Map<String, Object> maps = new HashMap<String, Object>();

		maps.put("type", privilege.getType());
		maps.put("object", privilege.getObject());
		maps.put("grantor", privilege.getGrantor());
		maps.put("grantee", privilege.getGrantee());
		maps.put("option", privilege.getOption());
		maps.put("description", privilege.getDescription());

		createDocs(id, PRIVILEGE_TYPE, parentId, DATABASE_TYPE, maps);
	}

	private void createDocs(String id, String type, String parentId,
			String parentType, Map<String, Object> maps) {
		SolrInputDocument doc = null;
		Set<SolrInputDocument> docs = new HashSet<SolrInputDocument>();

		for (String key : maps.keySet()) {
			doc = createDoc(id + "_" + key, type, parentId, parentType, key,
					maps.get(key));
			docs.add(doc);
		}
		addDocs(metaCoreServer, docs);
	}

	private SolrInputDocument createDoc(String id, String type,
			String parentId, String parentType, String key, Object value) {
		SolrInputDocument doc = new SolrInputDocument();
		doc.addField(META_ID, id);
		doc.addField(META_TYPE, type);
		doc.addField(META_PARENT_ID, parentId);
		doc.addField(META_PARENT_TYPE, parentType);
		doc.addField(META_KEY, key);
		doc.addField(META_VALUE, value);
		return doc;
	}

	private void addDocs(EmbeddedSolrServer server, Set<SolrInputDocument> docs) {
		try {
			if (docs.size() > 0) {
				server.add(docs);
			}
		} catch (SolrServerException e) {
			logger.error("An error ocurred while adding documents to Solr Server");
		} catch (IOException e) {
			logger.error("An error ocurred while adding documents to Solr Server");
		}
	}

	private void commitDocs(EmbeddedSolrServer server) {
		try {
			server.commit();
		} catch (SolrServerException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	@Override
	public void handleDataOpenTable(String tableId) throws ModuleException {
		currentCount = 0;
		rowsNumber = 0;

		if (dbStructure != null) {
			TableStructure table = dbStructure.lookupTableStructure(tableId);
			this.currentTableStructure = table;
			if (currentTableStructure != null) {
				this.currentDocs = new HashSet<SolrInputDocument>();
			} else {
				throw new ModuleException("Could not find table id '" + tableId
						+ "' in database structure");
			}
		} else {
			throw new ModuleException(
					"Cannot open table before database structure is created");
		}
	}

	@Override
	public void handleDataCloseTable(String tableId) throws ModuleException {
		if (currentCount != 0) {
			try {
				dataCoreServer.add(currentDocs);
				dataCoreServer.commit();
				currentDocs.clear();
			} catch (SolrServerException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		currentTableStructure = null;
	}

	@Override
	public void handleDataRow(Row row) throws InvalidDataException,
			ModuleException {

		int currentColN = 0;
		SolrInputDocument doc = new SolrInputDocument();

		String schemaName = currentTableStructure.getSchema().getName();
		String tableName = currentTableStructure.getName();

		currentCount++;
		rowsNumber++;
		logger.debug("handling row: " + rowsNumber);

		doc.addField(META_PREFIX + "schema", schemaName);
		doc.addField(META_PREFIX + "table", tableName);
		String tableId = schemaName + "." + tableName;
		doc.addField(META_PREFIX + "tableId", tableId);
		doc.addField(META_PREFIX + "id", tableId + "." + rowsNumber);
		doc.addField(META_PREFIX + "rowN", rowsNumber);

		Iterator<ColumnStructure> columnIterator = currentTableStructure
				.getColumns().iterator();
		for (Cell cell : row.getCells()) {
			currentColN++;
			ColumnStructure column = columnIterator.next();
			String data;
			if (cell instanceof BinaryCell) {
				data = "EXPORT BINARY FILE";
			} else {
				data = handleCell(cell);
			}

			if (data == null) {
				data = "";
			}

			doc.addField(META_PREFIX + "col_" + currentColN, column.getName());
			doc.addField(META_PREFIX + "colType_" + currentColN, column
					.getType().getOriginalTypeName());
			doc.addField(DATA_PREFIX + currentColN, data);
		}
		currentDocs.add(doc);

		if (currentCount % FETCH_SIZE == 0) {
			try {
				dataCoreServer.add(currentDocs);
				dataCoreServer.commit();
				currentDocs.clear();
				currentCount = 0;
			} catch (SolrServerException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}

	@Override
	public void finishDatabase() throws ModuleException {
		metaCoreServer.shutdown();
		dataCoreServer.shutdown();
	}

	protected String handleCell(Cell cell) {
		SimpleCell simpleCell = (SimpleCell) cell;
		return simpleCell.getSimpledata();
	}
}
