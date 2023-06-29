drop database if exists HEAP;
create database HEAP;
use HEAP;

create table USER (
UserID int not null primary key auto_increment,
Email varchar(50) not null,
Username varchar(20) not null
);

create table EVENT (
EventID int not null auto_increment,
CreatorID int not null,
EventName varchar(30) not null,
StartDate date not null,
EndDate date not null,
StartTime time not null,
EndTime time not null,
EventLink varchar(100) not null,
EventOver tinyint,
constraint event_pk primary key(EventID,CreatorID),
constraint event_fk foreign key(CreatorID) references USER(UserID));

create table AVAILABILITY (
UserID int not null,
EventID int not null,
Date date not null,
StartTime time not null,
EndTime time not null,
constraint availability_pk primary key (UserID,EventID),
constraint availability_fk1 foreign key(UserID) references USER(UserID),
constraint availability_fk2 foreign key(EventID) references EVENT(EventID)
);