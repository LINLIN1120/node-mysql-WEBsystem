const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'todo_app'
});

router.get('/', function (req, res, next) {
const isAuth = req.isAuthenticated();
if (isAuth) {
const userId = req.user.id;
// console.log(`isAuth: ${isAuth}`); // Debugging line to check if the user is authenticated

  knex("tasks")
    .select("*")
     .where({user_id: userId})
    .then(function (results) {
      console.log(results);
      res.render('index', {
        title: 'ToDo App',
        todos: results,
        isAuth: isAuth,
      });
    })
    .catch(function (err) {
      console.error(err);
      res.render('index', {
        title: 'ToDo App',
        todos: [],
        isAuth: isAuth,
        errorMessage: [err.sqlMessage],
      });
    });
  } else {
    res.render('index', {
      title: 'ToDo App',
      isAuth: isAuth,
    });
  }
});

router.post('/', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  
  console.log('=== POST / ===');
  console.log('isAuth:', isAuth);
  console.log('req.user:', req.user);
  console.log('req.body:', req.body);
  
  if (!isAuth || !req.user || !req.user.id) {
    console.log('Authentication failed or missing user');
    return res.status(401).redirect('/signin');
  }
  
  try {
    const userId = req.user.id;
    const todo = req.body.add;
    const priority = req.body.priority || '2';
    let deadline = req.body.deadline || null;
    
    console.log('Processing task:', { userId, todo, priority, deadline });
    
    // Validation
    if (!todo || !todo.trim()) {
      throw new Error('タスク内容が空です');
    }
    
    // datetime-local形式をMySQLのDATETIME形式に変換
    if (deadline && deadline.trim()) {
      deadline = deadline.replace('T', ' ');
      console.log('Converted deadline:', deadline);
    } else {
      deadline = null;
    }
    
    const taskData = {
      user_id: userId,
      content: todo,
      priority: parseInt(priority)
    };
    
    if (deadline) {
      taskData.deadline = deadline;
    }
    
    console.log('Final taskData:', taskData);
    
    knex("tasks")
      .insert(taskData)
      .then(function () {
        console.log('Task inserted successfully');
        res.redirect('/')
      })
      .catch(function (err) {
        console.error('Insert error:', err);
        
        // 既存タスクを取得して表示
        knex("tasks")
          .select("*")
          .where({user_id: userId})
          .orderBy('priority', 'asc')
          .orderBy('deadline', 'asc')
          .then(function (todos) {
            res.render('index', {
              title: 'ToDo App',
              todos: todos,
              isAuth: true,
              errorMessage: ['エラー: ' + (err.sqlMessage || err.message)],
            });
          })
          .catch(function (err2) {
            console.error('Fetch error:', err2);
            res.render('index', {
              title: 'ToDo App',
              todos: [],
              isAuth: true,
              errorMessage: ['データベースエラーが発生しました'],
            });
          });
      });
  } catch (err) {
    console.error('Exception:', err);
    res.render('index', {
      title: 'ToDo App',
      todos: [],
      isAuth: true,
      errorMessage: ['エラー: ' + err.message],
    });
  }
});

// 削除機能
router.post('/delete/:id', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  
  if (!isAuth) {
    return res.redirect('/signin');
  }
  
  const taskId = req.params.id;
  const userId = req.user.id;
  
  knex("tasks")
    .where({id: taskId, user_id: userId})
    .delete()
    .then(function () {
      res.redirect('/');
    })
    .catch(function (err) {
      console.error(err);
      res.render('index', {
        title: 'ToDo App',
        todos: [],
        isAuth: isAuth,
        errorMessage: [err.sqlMessage],
      });
    });
});

router.use('/signup', require('./signup'));
router.use('/signin', require('./signin'));
router.use('/logout', require('./logout'));

module.exports = router;
