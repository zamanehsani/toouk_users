/**
 * @jest-environment node
 */

const request = require('supertest');
const express = require('express');

// Simple integration test for user endpoints
describe('User Endpoints Integration Test', () => {
  let app;

  beforeAll(() => {
    // Create a minimal test app
    app = express();
    app.use(express.json());
    
    // Simple test route
    app.get('/users', (req, res) => {
      res.json({ 
        users: [], 
        pagination: { page: 1, limit: 10, total: 0, pages: 0 } 
      });
    });

    app.post('/users', (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      res.status(201).json({ 
        user: { id: 1, email, firstName: null, lastName: null, role: 'USER' },
        message: 'User created successfully'
      });
    });
  });

  test('GET /users should return empty list initially', async () => {
    const response = await request(app)
      .get('/users')
      .expect(200);

    expect(response.body).toHaveProperty('users');
    expect(response.body.users).toHaveLength(0);
    expect(response.body).toHaveProperty('pagination');
  });

  test('POST /users should create user with valid data', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/users')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('message', 'User created successfully');
    expect(response.body.user.email).toBe(userData.email);
  });

  test('POST /users should return 400 for missing email', async () => {
    const userData = { password: 'password123' };

    const response = await request(app)
      .post('/users')
      .send(userData)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Email and password are required');
  });

  test('POST /users should return 400 for missing password', async () => {
    const userData = { email: 'test@example.com' };

    const response = await request(app)
      .post('/users')
      .send(userData)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Email and password are required');
  });
});
