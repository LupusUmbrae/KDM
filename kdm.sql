drop table if exists users;
create table users (
  user_id integer primary key autoincrement,
  username text not null,
  password text not null
);

drop table if exists kdm;
create table kdm (
  kdm_id integer primary key autoincrement,
  owner_id integer,
  name text not null,
  content text not null,
  
  constraint fk_kdm_owner foreign key (owner_id)
  references Users(user_id)
);

drop table if exists kdm_editors;
create table kdm_editors (
  kdm_id integer,
  user_id integer,
  
  constraint fk_kdm_editors_kdm_id foreign key(kdm_id) 
  references kdm(kdm_id),
  
  constraint fk_kdm_editors_users_id foreign key(user_id) 
  references users(user_id)
);