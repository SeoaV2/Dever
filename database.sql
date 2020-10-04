create user dever@localhost;
create schema dever;

grant all privileges on dever.* to dever@localhost;
use dever;

create table users (
  uid varchar(36) not null,
  uname text not null,
  upasswd varchar(64) not null
);

create unique index users_uid_uindex
	on users (uid);

alter table users
	add constraint users_pk
		primary key (uid);

create table messages (
  mid varchar(36) not null,
  mauthor text not null,
  mcontent text not null,
  mchannel text not null,
  mcreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP not null
);

create unique index messages_mid_uindex
	on messages (mid);

alter table messages
	add constraint messages_pk
		primary key (mid);
