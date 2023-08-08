## MeetnGo 🐝
Done By:
  * Lynette Jean Tay
  * Paul Bryant Madhavan
  * Tan Kai Xuan
  * Andy Tan
  * Chen Wen Han

## Steps to Run Application
1. Clone Github repo and cd into the folder from the terminal
2. Install nvm and node
3. Install nodemon using `npm install -g nodemon`
4. Run `npm start` for both frontend folder and backend folder in 2 different terminal/consoles

## Considerations
**Microservice architecture**: Frontend and backend are two different microservices hosted on two different servers 3000 and 3001

**Security**: Encryption of userData cookie
  * In the path /Backend/server.js line 71, the userData is encrypted. In line 72, the encrypted cookie is set.
  * The encryption and decryption methods are stored in /Backend/encrypt.js
  * The initialization vector and encryption key are randomly generated in /Backend/encrypt.js
  * When a request is made via the front end, the decryption method is called to decrypt the cookie. This can be seen in /Backend/server.js line 125 and line 182

**Deployment**: Cloud databases
  * Firestore for backend processing (refer to backend/model/firebaseconfig.js)
  * MySQL hosted on AWS RDS for frontend displays (refer to backend/model/databaseconfig.js)

## User Workflow Diagram
![image](https://github.com/smu-hack-dsc/Team-09-Project/assets/72553981/f94c1e07-8eb4-48d5-aa52-e47170c562e5)

## Links
[Wireframe link](https://www.figma.com/file/zuoyCpjDnOFwrtxNaL64uQ/MeetnGo?type=design&node-id=4-6&mode=design&t=WjtzAKiS5iyajR77-0)

[Google folder link](https://drive.google.com/drive/folders/1d6CA3nD4tObctO-d_Uqgg_Prw7Q5aQmf?usp=drive_link)
