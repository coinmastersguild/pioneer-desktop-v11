DNS
dns

Domain types

DNSAnalyticsNominalMetric = Array<unknown>
Nominal metric values, broken down by time interval.


DNSAnalyticsQuery = { dimensions, limit, metrics, 5 more... }
DNS
Analytics
dns.analytics

DNS
Analytics
Reports
dns.analytics.reports

Methods


Table -> Envelope<Report>
get
/zones/{zone_id}/dns_analytics/report
Retrieves a list of summarised aggregate metrics over a given time period.

See Analytics API properties for detailed information about the available query parameters.

Domain types


Report = { data, data_lag, max, 4 more... }
DNS
Analytics
Reports
Bytimes
dns.analytics.reports.bytimes

Methods


By Time -> Envelope<ByTime>
get
/zones/{zone_id}/dns_analytics/report/bytime
Retrieves a list of aggregate metrics grouped by time interval.

See Analytics API properties for detailed information about the available query parameters.

Domain types


ByTime = { data, data_lag, max, 5 more... }
DNS
DNSSEC
dns.dnssec

Methods


Delete DNSSEC Records -> Envelope<string>
delete
/zones/{zone_id}/dnssec
Delete DNSSEC.


Edit DNSSEC Status -> Envelope<DNSSEC>
patch
/zones/{zone_id}/dnssec
Enable or disable DNSSEC.


DNSSEC Details -> Envelope<DNSSEC>
get
/zones/{zone_id}/dnssec
Details about DNSSEC status and configuration.

Domain types


DNSSEC = { algorithm, digest, digest_algorithm, 10 more... }
DNS
Records
dns.records

Methods


Batch DNS Records -> Envelope<{ deletes, patches, posts, 1 more... }>
post
/zones/{zone_id}/dns_records/batch
Send a Batch of DNS Record API calls to be executed together.

Notes:

Although Cloudflare will execute the batched operations in a single database transaction, Cloudflare's distributed KV store must treat each record change as a single key-value pair. This means that the propagation of changes is not atomic. See the documentation for more information.

The operations you specify within the /batch request body are always executed in the following order:

Deletes
Patches
Puts
Posts

Create DNS Record -> Envelope<RecordResponse>
post
/zones/{zone_id}/dns_records
Create a new DNS record for a zone.

Notes:

A/AAAA records cannot exist on the same name as CNAME records.
NS records cannot exist on the same name as any other record type.
Domain names are always represented in Punycode, even if Unicode characters were used when creating the record.

Delete DNS Record -> Envelope<{ id }>
delete
/zones/{zone_id}/dns_records/{dns_record_id}
Delete DNS Record


Update DNS Record -> Envelope<RecordResponse>
patch
/zones/{zone_id}/dns_records/{dns_record_id}
Update an existing DNS record.

Notes:

A/AAAA records cannot exist on the same name as CNAME records.
NS records cannot exist on the same name as any other record type.
Domain names are always represented in Punycode, even if Unicode characters were used when creating the record.

Export DNS Records -> string
get
/zones/{zone_id}/dns_records/export
You can export your BIND config through this endpoint.

See the documentation for more information.


DNS Record Details -> Envelope<RecordResponse>
get
/zones/{zone_id}/dns_records/{dns_record_id}
DNS Record Details


Import DNS Records -> Envelope<{ recs_added, total_records_parsed }>
post
/zones/{zone_id}/dns_records/import
You can upload your BIND config through this endpoint. It assumes that cURL is called from a location with bind_config.txt (valid BIND config) present.

See the documentation for more information.


List DNS Records -> V4PagePaginationArray<RecordResponse>
get
/zones/{zone_id}/dns_records
List, search, sort, and filter a zones' DNS records.


Scan DNS Records -> Envelope<{ recs_added, total_records_parsed }>
post
/zones/{zone_id}/dns_records/scan
Scan for common DNS records on your domain and automatically add them to your zone. Useful if you haven't updated your nameservers yet.


Overwrite DNS Record -> Envelope<RecordResponse>
put
/zones/{zone_id}/dns_records/{dns_record_id}
Overwrite an existing DNS record.

Notes:

A/AAAA records cannot exist on the same name as CNAME records.
NS records cannot exist on the same name as any other record type.
Domain names are always represented in Punycode, even if Unicode characters were used when creating the record.
Domain types


ARecord = { comment, content, name, 5 more... }

AAAARecord = { comment, content, name, 5 more... }

BatchPatch = ARecord | AAAARecord | CAARecord | 18 more...

BatchPut = ARecord | AAAARecord | CAARecord | 18 more...

CAARecord = { comment, content, data, 6 more... }

CERTRecord = { comment, content, data, 6 more... }

CNAMERecord = { comment, content, name, 5 more... }

DNSKEYRecord = { comment, content, data, 6 more... }

DSRecord = { comment, content, data, 6 more... }

HTTPSRecord = { comment, content, data, 6 more... }

LOCRecord = { comment, content, data, 6 more... }

MXRecord = { comment, content, name, 6 more... }

NAPTRRecord = { comment, content, data, 6 more... }

NSRecord = { comment, content, name, 5 more... }

PTRRecord = { comment, content, name, 5 more... }

Record = ARecord | AAAARecord | CAARecord | 18 more...

RecordResponse = ARecord | AAAARecord | CAARecord | 18 more...
RecordTags = string
Individual tag of the form name:value (the name must consist of only letters, numbers, underscores and hyphens)


SMIMEARecord = { comment, content, data, 6 more... }

SRVRecord = { comment, content, data, 6 more... }

SSHFPRecord = { comment, content, data, 6 more... }

SVCBRecord = { comment, content, data, 6 more... }

TLSARecord = { comment, content, data, 6 more... }

TTL = number | 1
Time To Live (TTL) of the DNS record in seconds. Setting to 1 means 'automatic'. Value must be between 60 and 86400, with the minimum reduced to 30 for Enterprise zones.


TXTRecord = { comment, content, name, 5 more... }

URIRecord = { comment, content, data, 7 more... }
DNS
Settings
dns.settings

Domain types


DNSSetting = { flatten_all_cnames, foundation_dns, internal_dns, 5 more... }
DNS
Settings
Account
dns.settings.account

Methods


Update DNS Settings -> Envelope<{ zone_defaults }>
patch
/accounts/{account_id}/dns_settings
Update DNS settings for an account


Show DNS Settings -> Envelope<{ zone_defaults }>
get
/accounts/{account_id}/dns_settings
Show DNS settings for an account

DNS
Settings
Account
Views
dns.settings.account.views

Methods


Create Internal DNS View -> Envelope<{ id, created_time, modified_time, 2 more... }>
post
/accounts/{account_id}/dns_settings/views
Create Internal DNS View for an account


Delete Internal DNS View -> Envelope<{ id }>
delete
/accounts/{account_id}/dns_settings/views/{view_id}
Delete an existing Internal DNS View


Update Internal DNS View -> Envelope<{ id, created_time, modified_time, 2 more... }>
patch
/accounts/{account_id}/dns_settings/views/{view_id}
Update an existing Internal DNS View


DNS Internal View Details -> Envelope<{ id, created_time, modified_time, 2 more... }>
get
/accounts/{account_id}/dns_settings/views/{view_id}
Get DNS Internal View


List Internal DNS Views -> V4PagePaginationArray<{ id, created_time, modified_time, 2 more... }>
get
/accounts/{account_id}/dns_settings/views
List DNS Internal Views for an Account

DNS
Settings
Zone
dns.settings.zone

Methods


Update DNS Settings -> Envelope<{ flatten_all_cnames, foundation_dns, internal_dns, 6 more... }>
patch
/zones/{zone_id}/dns_settings
Update DNS settings for a zone


Show DNS Settings -> Envelope<{ flatten_all_cnames, foundation_dns, internal_dns, 6 more... }>
get
/zones/{zone_id}/dns_settings
Show DNS settings for a zone

DNS
Zone Transfers
dns.zone_transfers

DNS
Zone Transfers
ACLs
dns.zone_transfers.acls

Methods


Create ACL -> Envelope<ACL>
post
/accounts/{account_id}/secondary_dns/acls
Create ACL.


Delete ACL -> Envelope<{ id }>
delete
/accounts/{account_id}/secondary_dns/acls/{acl_id}
Delete ACL.


ACL Details -> Envelope<ACL>
get
/accounts/{account_id}/secondary_dns/acls/{acl_id}
Get ACL.


List ACLs -> SinglePage<ACL>
get
/accounts/{account_id}/secondary_dns/acls
List ACLs.


Update ACL -> Envelope<ACL>
put
/accounts/{account_id}/secondary_dns/acls/{acl_id}
Modify ACL.

Domain types


ACL = { id, ip_range, name }
DNS
Zone Transfers
Force AXFR
dns.zone_transfers.force_axfr

Methods


Force AXFR -> Envelope<ForceAXFR>
post
/zones/{zone_id}/secondary_dns/force_axfr
Sends AXFR zone transfer request to primary nameserver(s).

Domain types

ForceAXFR = string
When force_axfr query parameter is set to true, the response is a simple string

DNS
Zone Transfers
Incoming
dns.zone_transfers.incoming

Methods


Create Secondary Zone Configuration -> Envelope<{ id, auto_refresh_seconds, checked_time, 5 more... }>
post
/zones/{zone_id}/secondary_dns/incoming
Create secondary zone configuration for incoming zone transfers.


Delete Secondary Zone Configuration -> Envelope<{ id }>
delete
/zones/{zone_id}/secondary_dns/incoming
Delete secondary zone configuration for incoming zone transfers.


Secondary Zone Configuration Details -> Envelope<{ id, auto_refresh_seconds, checked_time, 5 more... }>
get
/zones/{zone_id}/secondary_dns/incoming
Get secondary zone configuration for incoming zone transfers.


Update Secondary Zone Configuration -> Envelope<{ id, auto_refresh_seconds, checked_time, 5 more... }>
put
/zones/{zone_id}/secondary_dns/incoming
Update secondary zone configuration for incoming zone transfers.

Domain types


Incoming = { id, auto_refresh_seconds, checked_time, 5 more... }
DNS
Zone Transfers
Outgoing
dns.zone_transfers.outgoing

Methods


Create Primary Zone Configuration -> Envelope<{ id, checked_time, created_time, 4 more... }>
post
/zones/{zone_id}/secondary_dns/outgoing
Create primary zone configuration for outgoing zone transfers.


Delete Primary Zone Configuration -> Envelope<{ id }>
delete
/zones/{zone_id}/secondary_dns/outgoing
Delete primary zone configuration for outgoing zone transfers.


Disable Outgoing Zone Transfers -> Envelope<DisableTransfer>
post
/zones/{zone_id}/secondary_dns/outgoing/disable
Disable outgoing zone transfers for primary zone and clears IXFR backlog of primary zone.


Enable Outgoing Zone Transfers -> Envelope<EnableTransfer>
post
/zones/{zone_id}/secondary_dns/outgoing/enable
Enable outgoing zone transfers for primary zone.


Force DNS Notify -> Envelope<string>
post
/zones/{zone_id}/secondary_dns/outgoing/force_notify
Notifies the secondary nameserver(s) and clears IXFR backlog of primary zone.


Primary Zone Configuration Details -> Envelope<{ id, checked_time, created_time, 4 more... }>
get
/zones/{zone_id}/secondary_dns/outgoing
Get primary zone configuration for outgoing zone transfers.


Update Primary Zone Configuration -> Envelope<{ id, checked_time, created_time, 4 more... }>
put
/zones/{zone_id}/secondary_dns/outgoing
Update primary zone configuration for outgoing zone transfers.

Domain types

DisableTransfer = string
The zone transfer status of a primary zone

EnableTransfer = string
The zone transfer status of a primary zone


Outgoing = { id, checked_time, created_time, 4 more... }
OutgoingStatus = string
The zone transfer status of a primary zone

DNS
Zone Transfers
Outgoing
Status
dns.zone_transfers.outgoing.status

Methods


Get Outgoing Zone Transfer Status -> Envelope<EnableTransfer>
get
/zones/{zone_id}/secondary_dns/outgoing/status
Get primary zone transfer status.

DNS
Zone Transfers
Peers
dns.zone_transfers.peers

Methods


Create Peer -> Envelope<Peer>
post
/accounts/{account_id}/secondary_dns/peers
Create Peer.


Delete Peer -> Envelope<{ id }>
delete
/accounts/{account_id}/secondary_dns/peers/{peer_id}
Delete Peer.


Peer Details -> Envelope<Peer>
get
/accounts/{account_id}/secondary_dns/peers/{peer_id}
Get Peer.


List Peers -> SinglePage<Peer>
get
/accounts/{account_id}/secondary_dns/peers
List Peers.


Update Peer -> Envelope<Peer>
put
/accounts/{account_id}/secondary_dns/peers/{peer_id}
Modify Peer.

Domain types


Peer = { id, name, ip, 3 more... }
DNS
Zone Transfers
TSIGs
dns.zone_transfers.tsigs

Methods


Create TSIG -> Envelope<TSIG>
post
/accounts/{account_id}/secondary_dns/tsigs
Create TSIG.


Delete TSIG -> Envelope<{ id }>
delete
/accounts/{account_id}/secondary_dns/tsigs/{tsig_id}
Delete TSIG.


TSIG Details -> Envelope<TSIG>
get
/accounts/{account_id}/secondary_dns/tsigs/{tsig_id}
Get TSIG.


List TSIGs -> SinglePage<TSIG>
get
/accounts/{account_id}/secondary_dns/tsigs
List TSIGs.


Update TSIG -> Envelope<TSIG>
put
/accounts/{account_id}/secondary_dns/tsigs/{tsig_id}
Modify TSIG.

Domain types


TSIG = { id, algo, name, 1 more... }
