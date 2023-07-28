drop database if exists HEAP;
create database HEAP;
use HEAP;

create table USER (
UserID int not null primary key auto_increment,
Email varchar(50) not null,
Username varchar(20) not null
);

create table EVENT (
EventLink varchar(100) not null,
CreatorID int not null,
EventName varchar(30) not null,
EventOver tinyint,
constraint event_pk primary key(EventLink,CreatorID),
constraint event_fk foreign key(CreatorID) references USER(UserID));

create table eventDate (
EventID varchar(100) not null,
Date date not null,
constraint eventDate_pk primary key(EventID,Date),
constraint eventDate_fk foreign key(EventID) references EVENT(EventLink));

create table AVAILABILITY (
UserID int not null,
EventID varchar(100) not null,
Date date not null,
StartTime time not null,
EndTime time not null,
constraint availability_pk primary key (UserID,EventID,Date,StartTime),
constraint availability_fk1 foreign key(UserID) references USER(UserID),
constraint availability_fk2 foreign key(EventID) references EVENT(EventLink)
);
