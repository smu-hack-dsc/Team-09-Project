drop database if exists HEAP;
create database HEAP;
use HEAP;

create table USER (
Email varchar(50) not null primary key,
Username varchar(20) not null
);

create table EVENT (
EventID varchar(36) not null,
Creator varchar(50) not null,
EventName varchar(30) not null,
EventOver tinyint,
constraint event_pk primary key(EventID,Creator),
constraint event_fk foreign key(Creator) references USER(Email));

create table eventDate (
EventID varchar(36) not null,
Date date not null,
constraint eventDate_pk primary key(EventID,Date),
constraint eventDate_fk foreign key(EventID) references EVENT(EventID));