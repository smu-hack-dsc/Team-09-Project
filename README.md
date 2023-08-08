# Team-09-Project
Application Name: MeetnGo


Done By:
1. Lynette Jean Tay
2. Paul Bryant Madhavan
3. Tan Kai Xuan
4. Andy Tan
5. Chen Wen Han


Steps after cloning from github:
1. Run the database setup in your mysql to create the tables and contents. Check that your SQL server is running on port 3306. If not edit the config under Backend/model/databaseconfig.js
2. Install nodemon using **npm install -g nodemon**.
3. Run **npm start** for both frontend folder and backend folder in 2 different terminal/consoles. (If frontend npm start is not functional, **use node server.js** for frontend instead)  


Security:
Encryption of userData cookie
<ol>
  <li>In the path /Backend/server.js line 71, the userData is encrypted. In line 72, the encrypted cookie is set.</li>
  <li>The encryption and decryption methods are stored in /Backend/encrypt.js</li>
  <li>The initialisation vector and encryption key are randomly generated in /Backend/encrypt.js</li>
  <li>When a request is made via the front end, the decryption method is called to decrypt the cookie. This can be seen in /Backend/server.js line 125 and line 182.</li>
</ol>


Wireframe link: https://www.figma.com/file/zuoyCpjDnOFwrtxNaL64uQ/MeetnGo?type=design&node-id=4-6&mode=design&t=WjtzAKiS5iyajR77-0
Google folder link: https://drive.google.com/drive/folders/1d6CA3nD4tObctO-d_Uqgg_Prw7Q5aQmf?usp=drive_link