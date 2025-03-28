API Gateway
api_gateway

API Gateway
Configurations
api_gateway.configurations

Methods


Retrieve Information About Specific Configuration Properties -> Envelope<Configuration>
get
/zones/{zone_id}/api_gateway/configuration
Retrieve information about specific configuration properties


Set Configuration Properties -> { errors, messages, success }
put
/zones/{zone_id}/api_gateway/configuration
Set configuration properties

Domain types


Configuration = { auth_id_characteristics }
API Gateway
Discovery
api_gateway.discovery

Methods


Retrieve Discovered Operations On A Zone Rendered As OpenAPI Schemas -> Envelope<{ schemas, timestamp }>
get
/zones/{zone_id}/api_gateway/discovery
Retrieve the most up to date view of discovered operations, rendered as OpenAPI schemas

Domain types


DiscoveryOperation = { id, endpoint, host, 5 more... }
API Gateway
Discovery
Operations
api_gateway.discovery.operations

Methods


Patch Discovered Operations -> Envelope<Record<string, { state }>>
patch
/zones/{zone_id}/api_gateway/discovery/operations
Update the state on one or more discovered operations


Patch Discovered Operation -> Envelope<{ state }>
patch
/zones/{zone_id}/api_gateway/discovery/operations/{operation_id}
Update the state on a discovered operation


Retrieve Discovered Operations On A Zone -> V4PagePaginationArray<DiscoveryOperation>
get
/zones/{zone_id}/api_gateway/discovery/operations
Retrieve the most up to date view of discovered operations

API Gateway
Expression Template
api_gateway.expression_template

API Gateway
Expression Template
Fallthrough
api_gateway.expression_template.fallthrough

Methods


Generate Fallthrough WAF Expression Template From A Set Of API Hosts -> Envelope<{ expression, title }>
post
/zones/{zone_id}/api_gateway/expression-template/fallthrough
Generate fallthrough WAF expression template from a set of API hosts

API Gateway
Operations
api_gateway.operations

Methods


Add Operations To A Zone -> SinglePage<{ endpoint, host, last_updated, 3 more... }>
post
/zones/{zone_id}/api_gateway/operations
Add one or more operations to a zone. Endpoints can contain path variables. Host, method, endpoint will be normalized to a canoncial form when creating an operation and must be unique on the zone. Inserting an operation that matches an existing one will return the record of the already existing operation and update its last_updated date.


Delete Multiple Operations -> { errors, messages, success }
delete
/zones/{zone_id}/api_gateway/operations
Delete multiple operations


Add One Operation To A Zone -> Envelope<{ endpoint, host, last_updated, 3 more... }>
post
/zones/{zone_id}/api_gateway/operations/item
Add one operation to a zone. Endpoints can contain path variables. Host, method, endpoint will be normalized to a canoncial form when creating an operation and must be unique on the zone. Inserting an operation that matches an existing one will return the record of the already existing operation and update its last_updated date.


Delete An Operation -> { errors, messages, success }
delete
/zones/{zone_id}/api_gateway/operations/{operation_id}
Delete an operation


Retrieve Information About An Operation -> Envelope<{ endpoint, host, last_updated, 3 more... }>
get
/zones/{zone_id}/api_gateway/operations/{operation_id}
Retrieve information about an operation


Retrieve Information About All Operations On A Zone -> V4PagePaginationArray<{ endpoint, host, last_updated, 3 more... }>
get
/zones/{zone_id}/api_gateway/operations
Retrieve information about all operations on a zone

Domain types


APIShield = { endpoint, host, last_updated, 2 more... }
API Gateway
Operations
Schema Validation
api_gateway.operations.schema_validation

Methods


Update Multiple Operation Level Schema Validation Settings -> Envelope<SettingsMultipleRequest>
patch
/zones/{zone_id}/api_gateway/operations/schema_validation
Updates multiple operation-level schema validation settings on the zone


Retrieve Operation Level Schema Validation Settings -> { mitigation_action }
get
/zones/{zone_id}/api_gateway/operations/{operation_id}/schema_validation
Retrieves operation-level schema validation settings on the zone


Update Operation Level Schema Validation Settings -> { mitigation_action }
put
/zones/{zone_id}/api_gateway/operations/{operation_id}/schema_validation
Updates operation-level schema validation settings on the zone

Domain types


SettingsMultipleRequest = Record<string, { mitigation_action }>
API Gateway
Schemas
api_gateway.schemas

Methods


Retrieve Operations And Features As OpenAPI Schemas -> Envelope<{ schemas, timestamp }>
get
/zones/{zone_id}/api_gateway/schemas
Retrieve operations and features as OpenAPI schemas

API Gateway
Settings
api_gateway.settings

Domain types


Settings = { validation_default_mitigation_action, validation_override_mitigation_action }
API Gateway
Settings
Schema Validation
api_gateway.settings.schema_validation

Methods


Update Zone Level Schema Validation Settings -> Settings
patch
/zones/{zone_id}/api_gateway/settings/schema_validation
Updates zone level schema validation settings on the zone


Retrieve Zone Level Schema Validation Settings -> Settings
get
/zones/{zone_id}/api_gateway/settings/schema_validation
Retrieves zone level schema validation settings currently set on the zone


Update Zone Level Schema Validation Settings -> Settings
put
/zones/{zone_id}/api_gateway/settings/schema_validation
Updates zone level schema validation settings on the zone

API Gateway
User Schemas
api_gateway.user_schemas

Methods


Upload A Schema To A Zone -> Envelope<SchemaUpload>
post
/zones/{zone_id}/api_gateway/user_schemas
Upload a schema to a zone


Delete A Schema -> { errors, messages, success }
delete
/zones/{zone_id}/api_gateway/user_schemas/{schema_id}
Delete a schema


Enable Validation For A Schema -> Envelope<PublicSchema>
patch
/zones/{zone_id}/api_gateway/user_schemas/{schema_id}
Enable validation for a schema


Retrieve Information About A Specific Schema On A Zone -> Envelope<PublicSchema>
get
/zones/{zone_id}/api_gateway/user_schemas/{schema_id}
Retrieve information about a specific schema on a zone


Retrieve Information About All Schemas On A Zone -> V4PagePaginationArray<PublicSchema>
get
/zones/{zone_id}/api_gateway/user_schemas
Retrieve information about all schemas on a zone

Domain types

Message = Array<ResponseInfo>

PublicSchema = { created_at, kind, name, 3 more... }

SchemaUpload = { schema, upload_details }
API Gateway
User Schemas
Hosts
api_gateway.user_schemas.hosts

Methods


Retrieve Schema Hosts In A Zone -> V4PagePaginationArray<{ created_at, hosts, name, 1 more... }>
get
/zones/{zone_id}/api_gateway/user_schemas/hosts
Retrieve schema hosts in a zone

API Gateway
User Schemas
Operations
api_gateway.user_schemas.operations

Methods


Retrieve All Operations From A Schema -> V4PagePaginationArray<{ endpoint, host, last_updated, 3 more... } | { endpoint, host, method }>
get
/zones/{zone_id}/api_gateway/user_schemas/{schema_id}/operations
Retrieves all operations from the schema. Operations that already exist in API Shield Endpoint Management will be returned as full operations.

API Gateway
Schemas
api_gateway.schemas

Methods


Retrieve Operations And Features As OpenAPI Schemas -> Envelope<{ schemas, timestamp }>
get
/zones/{zone_id}/api_gateway/schemas
Retrieve operations and features as OpenAPI schemas

API Gateway
Settings
api_gateway.settings

Domain types


Settings = { validation_default_mitigation_action, validation_override_mitigation_action }
API Gateway
Settings
Schema Validation
api_gateway.settings.schema_validation

Methods


Update Zone Level Schema Validation Settings -> Settings
patch
/zones/{zone_id}/api_gateway/settings/schema_validation
Updates zone level schema validation settings on the zone


Retrieve Zone Level Schema Validation Settings -> Settings
get
/zones/{zone_id}/api_gateway/settings/schema_validation
Retrieves zone level schema validation settings currently set on the zone


Update Zone Level Schema Validation Settings -> Settings
put
/zones/{zone_id}/api_gateway/settings/schema_validation
Updates zone level schema validation settings on the zone

API Gateway
User Schemas
api_gateway.user_schemas

Methods


Upload A Schema To A Zone -> Envelope<SchemaUpload>
post
/zones/{zone_id}/api_gateway/user_schemas
Upload a schema to a zone


Delete A Schema -> { errors, messages, success }
delete
/zones/{zone_id}/api_gateway/user_schemas/{schema_id}
Delete a schema


Enable Validation For A Schema -> Envelope<PublicSchema>
patch
/zones/{zone_id}/api_gateway/user_schemas/{schema_id}
Enable validation for a schema


Retrieve Information About A Specific Schema On A Zone -> Envelope<PublicSchema>
get
/zones/{zone_id}/api_gateway/user_schemas/{schema_id}
Retrieve information about a specific schema on a zone


Retrieve Information About All Schemas On A Zone -> V4PagePaginationArray<PublicSchema>
get
/zones/{zone_id}/api_gateway/user_schemas
Retrieve information about all schemas on a zone

Domain types

Message = Array<ResponseInfo>

PublicSchema = { created_at, kind, name, 3 more... }

SchemaUpload = { schema, upload_details }
API Gateway
User Schemas
Hosts
api_gateway.user_schemas.hosts

Methods


Retrieve Schema Hosts In A Zone -> V4PagePaginationArray<{ created_at, hosts, name, 1 more... }>
get
/zones/{zone_id}/api_gateway/user_schemas/hosts
Retrieve schema hosts in a zone

API Gateway
User Schemas
Operations
api_gateway.user_schemas.operations

Methods


Retrieve All Operations From A Schema -> V4PagePaginationArray<{ endpoint, host, last_updated, 3 more... } | { endpoint, host, method }>
get
/zones/{zone_id}/api_gateway/user_schemas/{schema_id}/operations
Retrieves all operations from the schema. Operations that already exist in API Shield Endpoint Management will be returned as full operations.

