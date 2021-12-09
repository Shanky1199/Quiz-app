# Repo for the Quiz Application assignment.

## Task overview

1. User Management - There are three types of user
   a. Admin - Have all the privileges.
   b. Quiz Creator - Can create quizzes and users (who will attempt the quiz).
   c. User - Can login and attempt quizzes.

2. Quiz Creation -
   a. Quiz can have any number of questions.
   b. Questions can be of the following types -
   i. MCQ - User will be presented with multiple options where one option is correct.
   ii. Text based - User will have to give a text answer.
   iii. (Bonus) Adding multiple correct options to MCQ type questions.
   c. Quiz at any time can be in the following status -
   i. Draft - The quiz creator is in progress of creating the quiz.
   ii. Active - The quiz is made available for users to attempt.
   iii. Completed - The quiz cannot be attempted any more.

3. Quiz attempt -
   a. User can see list of available quizzes.
   b. User can attempt a quiz.
   c. User cannot reattempt the same quiz.
   d. User can see the marks for a particular quiz.

4. Reporting -
   a. List top 5 users based on correct answers for each quiz.

# Week 1 Tasks (2 Sep - 5th Sep )

- Designing the Schema/ Database for the present application .
- Making the Mongoose Models for the same .
- Working on Authentication for the user/admin/other login .
- Finalizing the Quiz format Structure

** Following things will be updated as the days goes **

Packages:

1. Axios: API requests
2. Argon2: Encryption, Decryption,
3. env-cmd: For providing environment variables when in dev,
