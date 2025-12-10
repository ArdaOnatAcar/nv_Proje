const request = require('supertest');
process.env.JWT_SECRET = 'test_secret';
const app = require('../server');
const db = require('../config/database');

/**
 * ACCEPTANCE TESTS FOR RANDEX PROJECT
 * Based on Design Document and Quality Assurance Plan
 * 
 * AT-01: Book Appointment (Customer) - Reference: UC-1, QA Plan TC-01
 * AT-02: Add Service (Business Owner) - Reference: UC-2, QA Plan TC-02
 * AT-03: Conflict Resolution (Double Booking Prevention) - Reference: SWC-006
 * AT-04: Manage Appointment (Cancel/Confirm) - Reference: UC-4, QA Plan TC-05
 */

describe('Acceptance Tests - Design Document Compliance', () => {
  let customerToken, customer2Token;
  let businessOwnerToken;
  let businessId;
  let serviceId, beardTrimServiceId;
  let staffId;
  let appointmentId;
  let customerId, customer2Id;

  const businessOwner = {
    email: `owner_${Date.now()}@randex.com`,
    password: 'SecurePass123!',
    name: 'Business Owner',
    phone: '5551234567',
    role: 'business_owner'
  };

  const customer = {
    email: `customer1_${Date.now()}@randex.com`,
    password: 'SecurePass123!',
    name: 'Customer One',
    phone: '5559876543',
    role: 'customer'
  };

  const customer2 = {
    email: `customer2_${Date.now()}@randex.com`,
    password: 'SecurePass123!',
    name: 'Customer Two',
    phone: '5559876544',
    role: 'customer'
  };

  beforeAll(async () => {
    console.log('\n========================================');
    console.log('RANDEX ACCEPTANCE TESTS');
    console.log('Design Document & QA Plan Compliance');
    console.log('========================================\n');

    // Setup: Register users
    let res = await request(app).post('/api/auth/register').send(businessOwner);
    businessOwnerToken = res.body.token;
    console.log('✓ Business Owner registered');

    res = await request(app).post('/api/auth/register').send(customer);
    customerToken = res.body.token;
    customerId = res.body.user.id;
    console.log('✓ Customer 1 registered');

    res = await request(app).post('/api/auth/register').send(customer2);
    customer2Token = res.body.token;
    customer2Id = res.body.user.id;
    console.log('✓ Customer 2 registered');

    // Setup: Create Business
    res = await request(app)
      .post('/api/businesses')
      .set('Authorization', `Bearer ${businessOwnerToken}`)
      .send({
        name: 'Test Barbershop',
        type: 'Barbershop',
        address: '123 Main St, Istanbul',
        phone: '02121234567',
        description: 'Professional barbershop services',
        opening_time: '09:00',
        closing_time: '18:00'
      });
    businessId = res.body.id;
    console.log(`✓ Business created (ID: ${businessId})`);

    // Setup: Add Staff
    res = await request(app)
      .post(`/api/businesses/${businessId}/staff`)
      .set('Authorization', `Bearer ${businessOwnerToken}`)
      .send({ name: 'Barber John', active: 1 });
    staffId = res.body.id;
    console.log(`✓ Staff added (ID: ${staffId})`);

    // Setup: Add Initial Service (Haircut)
    res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${businessOwnerToken}`)
      .send({
        business_id: businessId,
        name: 'Haircut',
        description: 'Professional haircut service',
        duration: 30,
        price: 200,
        staff_ids: [staffId]
      });
    serviceId = res.body.id;
    console.log(`✓ Service "Haircut" added (ID: ${serviceId})\n`);
  });

  afterAll((done) => {
    console.log('\n=== Cleanup ===');
    db.serialize(() => {
      db.run('DELETE FROM appointments WHERE business_id = ?', [businessId]);
      db.run('DELETE FROM services WHERE business_id = ?', [businessId]);
      db.run('DELETE FROM staff WHERE business_id = ?', [businessId]);
      db.run('DELETE FROM businesses WHERE id = ?', [businessId]);
      db.run('DELETE FROM users WHERE email IN (?, ?, ?)', 
        [businessOwner.email, customer.email, customer2.email], 
        () => {
          console.log('✓ Test data cleaned up\n');
          done();
        }
      );
    });
  });

  /**
   * AT-01: Book Appointment (Customer)
   * Reference: Design Document UC-1, QA Plan TC-01
   */
  describe('AT-01: Book Appointment (Customer)', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointmentDate = tomorrow.toISOString().split('T')[0];
    const appointmentTime = '14:00';

    it('AC-1.1: System must validate service, date, and time are provided', async () => {
      console.log('\n[AT-01.1] Validating required fields...');

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          business_id: businessId,
          // Missing service_id, date, time
        });

      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Error: ${res.body.error}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error');
      console.log('  ✓ Required field validation working');
    });

    it('AC-1.2: Frontend must send POST with Authorization header and JWT', async () => {
      console.log('\n[AT-01.2] Testing JWT authentication...');

      // First, check available slots
      const availRes = await request(app)
        .get(`/api/businesses/${businessId}/availability`)
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ service_id: serviceId, date: appointmentDate });

      console.log(`  Available slots: ${availRes.body.slots?.length || 0}`);
      expect(availRes.statusCode).toEqual(200);
      expect(availRes.body.slots.length).toBeGreaterThan(0);

      // Attempt booking without JWT
      const noAuthRes = await request(app)
        .post('/api/appointments')
        .send({
          business_id: businessId,
          service_id: serviceId,
          appointment_date: appointmentDate,
          start_time: appointmentTime
        });

      console.log(`  Without JWT Status: ${noAuthRes.statusCode}`);
      expect(noAuthRes.statusCode).toEqual(401);

      // Book with valid JWT
      const authRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          business_id: businessId,
          service_id: serviceId,
          appointment_date: appointmentDate,
          start_time: appointmentTime,
          notes: 'Test appointment'
        });

      console.log(`  With JWT Status: ${authRes.statusCode}`);
      console.log(`  Appointment ID: ${authRes.body.appointment_id}`);
      
      expect(authRes.statusCode).toEqual(201);
      expect(authRes.body).toHaveProperty('appointment_id');
      appointmentId = authRes.body.appointment_id;
      console.log('  ✓ JWT authentication enforced correctly');
    });

    it('AC-1.3: Database must create record with status "pending"', (done) => {
      console.log('\n[AT-01.3] Verifying database record...');

      db.get(
        'SELECT * FROM appointments WHERE id = ?',
        [appointmentId],
        (err, row) => {
          expect(err).toBeNull();
          expect(row).toBeTruthy();
          console.log(`  Appointment ID: ${row.id}`);
          console.log(`  Status: ${row.status}`);
          console.log(`  Date: ${row.appointment_date}`);
          console.log(`  Time: ${row.start_time}`);
          console.log(`  Business ID: ${row.business_id}`);
          console.log(`  Customer ID: ${row.customer_id}`);

          expect(row.status).toBe('pending');
          expect(row.business_id).toBe(businessId);
          expect(row.customer_id).toBe(customerId);
          console.log('  ✓ Database record created with status "pending"');
          done();
        }
      );
    });

    it('AC-1.4: User must see appointment in "My Appointments" page', async () => {
      console.log('\n[AT-01.4] Checking My Appointments page...');

      const res = await request(app)
        .get('/api/appointments/my-appointments')
        .set('Authorization', `Bearer ${customerToken}`);

      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Appointments found: ${res.body.length}`);

      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      const myAppointment = res.body.find(a => a.id === appointmentId);
      expect(myAppointment).toBeTruthy();
      console.log(`  Appointment details:`);
      console.log(`    - Business: ${myAppointment.business_name}`);
      console.log(`    - Service: ${myAppointment.service_name}`);
      console.log(`    - Date: ${myAppointment.appointment_date}`);
      console.log(`    - Time: ${myAppointment.start_time}`);
      console.log('  ✓ Appointment visible in customer view');
    });
  });

  /**
   * AT-02: Add Service (Business Owner)
   * Reference: Design Document UC-2, QA Plan TC-02
   */
  describe('AT-02: Add Service (Business Owner)', () => {
    it('AC-2.1: System must enforce RBAC - only business_owner can add services', async () => {
      console.log('\n[AT-02.1] Testing Role-Based Access Control...');

      // Attempt to add service as Customer (should fail)
      const customerAttempt = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          business_id: businessId,
          name: 'Unauthorized Service',
          price: 100,
          duration: 30,
          staff_ids: [staffId]
        });

      console.log(`  Customer attempt status: ${customerAttempt.statusCode}`);
      expect([403, 404]).toContain(customerAttempt.statusCode); // Forbidden or Not Found
      console.log('  ✓ Customer cannot add services (RBAC working)');
    });

    it('AC-2.2: Form must require Service Name, Duration, and Price', async () => {
      console.log('\n[AT-02.2] Validating required service fields...');

      // Missing required fields
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          business_id: businessId,
          // Missing name, duration, price
        });

      console.log(`  Status: ${res.statusCode}`);
      expect(res.statusCode).toEqual(400);
      console.log('  ✓ Required fields enforced');
    });

    it('AC-2.3: New service must be persisted with correct business_id', async () => {
      console.log('\n[AT-02.3] Adding "Beard Trim" service...');

      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${businessOwnerToken}`)
        .send({
          business_id: businessId,
          name: 'Beard Trim',
          description: 'Professional beard trimming and shaping',
          price: 150,
          duration: 30,
          staff_ids: [staffId]
        });

      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Service ID: ${res.body.id}`);
      console.log(`  Service Name: ${res.body.name}`);
      console.log(`  Price: ${res.body.price} TL`);
      console.log(`  Duration: ${res.body.duration} minutes`);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Beard Trim');
      expect(res.body.price).toBe(150);
      expect(res.body.duration).toBe(30);
      
      beardTrimServiceId = res.body.id;
      console.log('  ✓ Service created successfully');
    });

    it('AC-2.4: UI must show new service immediately (verify via API)', async () => {
      console.log('\n[AT-02.4] Verifying service appears in business details...');

      const res = await request(app)
        .get(`/api/businesses/${businessId}`);

      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Total services: ${res.body.services?.length || 0}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.services).toBeTruthy();
      
      const beardTrimService = res.body.services.find(s => s.id === beardTrimServiceId);
      expect(beardTrimService).toBeTruthy();
      console.log(`  Services list:`);
      res.body.services.forEach(s => {
        console.log(`    - ${s.name} (${s.price} TL, ${s.duration} min)`);
      });
      console.log('  ✓ New service visible in business details');
    });
  });

  /**
   * AT-03: Conflict Resolution (Double Booking Prevention)
   * Reference: Design Document "Calculating Available Time Algorithm", QA Plan SWC-006
   */
  describe('AT-03: Conflict Resolution (Double Booking Prevention)', () => {
    const conflictDate = new Date();
    conflictDate.setDate(conflictDate.getDate() + 2);
    const conflictDateStr = conflictDate.toISOString().split('T')[0];
    const conflictTime = '14:00';

    it('AC-3.1: Pre-condition - Create first appointment at 14:00', async () => {
      console.log('\n[AT-03.1] Creating first appointment (pre-condition)...');

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          business_id: businessId,
          service_id: serviceId,
          appointment_date: conflictDateStr,
          start_time: conflictTime,
          notes: 'First booking at 14:00'
        });

      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Appointment ID: ${res.body.appointment_id}`);
      console.log(`  Staff ID: ${res.body.staff_id}`);
      console.log(`  Time: ${conflictTime}`);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('appointment_id');
      console.log('  ✓ First appointment created successfully');
    });

    it('AC-3.2: System must query database for existing appointments', async () => {
      console.log('\n[AT-03.2] Verifying database check for conflicts...');

      // Check that the appointment exists in database
      await new Promise((resolve) => {
        db.get(
          `SELECT COUNT(*) as count FROM appointments 
           WHERE business_id = ? AND appointment_date = ? 
           AND start_time = ? AND status != 'cancelled'`,
          [businessId, conflictDateStr, conflictTime],
          (err, row) => {
            console.log(`  Existing appointments at ${conflictTime}: ${row.count}`);
            expect(row.count).toBe(1);
            console.log('  ✓ Database contains existing appointment');
            resolve();
          }
        );
      });
    });

    it('AC-3.3: Backend must return 409 Conflict for overlapping bookings', async () => {
      console.log('\n[AT-03.3] Attempting double booking (Customer 2)...');

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          business_id: businessId,
          service_id: serviceId,
          appointment_date: conflictDateStr,
          start_time: conflictTime,
          notes: 'Attempting to book same slot'
        });

      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Error Message: ${res.body.error}`);

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('error');
      console.log('  ✓ System prevented double booking (409 Conflict)');
    });

    it('AC-3.4: Database must not create duplicate record', (done) => {
      console.log('\n[AT-03.4] Verifying no duplicate appointments created...');

      db.get(
        `SELECT COUNT(*) as count FROM appointments 
         WHERE business_id = ? AND appointment_date = ? 
         AND start_time = ? AND status != 'cancelled'`,
        [businessId, conflictDateStr, conflictTime],
        (err, row) => {
          console.log(`  Total appointments at ${conflictTime}: ${row.count}`);
          expect(row.count).toBe(1);
          console.log('  ✓ Only one appointment exists (no duplicate)');
          done();
        }
      );
    });

    it('AC-3.5: Frontend receives user-friendly error message', async () => {
      console.log('\n[AT-03.5] Checking error message format...');

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          business_id: businessId,
          service_id: serviceId,
          appointment_date: conflictDateStr,
          start_time: conflictTime
        });

      console.log(`  Error message: "${res.body.error}"`);
      expect(res.body.error).toBeTruthy();
      expect(typeof res.body.error).toBe('string');
      console.log('  ✓ User-friendly error message provided');
    });
  });

  /**
   * AT-04: Manage Appointment (Cancel/Confirm)
   * Reference: Design Document UC-4, QA Plan TC-05
   */
  describe('AT-04: Manage Appointment (Cancel/Confirm)', () => {
    let managementAppointmentId;

    it('AC-4.0: Setup - Create appointment for status management', async () => {
      console.log('\n[AT-04.0] Creating appointment for management tests...');

      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 3);
      const dateStr = testDate.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          business_id: businessId,
          service_id: serviceId,
          appointment_date: dateStr,
          start_time: '11:00',
          notes: 'Appointment for status management test'
        });

      managementAppointmentId = res.body.appointment_id;
      console.log(`  Created appointment ID: ${managementAppointmentId}`);
      console.log('  ✓ Test appointment created');
    });

    it('AC-4.1: Customer must be able to cancel their own appointment', async () => {
      console.log('\n[AT-04.1] Customer cancelling appointment...');

      const res = await request(app)
        .put(`/api/appointments/${managementAppointmentId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'cancelled' });

      console.log(`  Status: ${res.statusCode}`);
      console.log(`  New status: ${res.body.status}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('cancelled');
      console.log('  ✓ Customer successfully cancelled appointment');
    });

    it('AC-4.2: Business Owner can change status to confirmed/completed', async () => {
      console.log('\n[AT-04.2] Business Owner managing appointment status...');

      // First, verify owner can access their appointments
      const listRes = await request(app)
        .get('/api/appointments/my-appointments')
        .set('Authorization', `Bearer ${businessOwnerToken}`);

      console.log(`  Business appointments count: ${listRes.body.length}`);
      expect(listRes.statusCode).toEqual(200);

      // Change first pending appointment to confirmed
      const appointment = listRes.body.find(a => a.id === appointmentId);
      if (appointment && appointment.status === 'pending') {
        const updateRes = await request(app)
          .put(`/api/appointments/${appointmentId}/status`)
          .set('Authorization', `Bearer ${businessOwnerToken}`)
          .send({ status: 'confirmed' });

        console.log(`  Update status: ${updateRes.statusCode}`);
        console.log(`  New status: ${updateRes.body.status}`);
        expect(updateRes.statusCode).toEqual(200);
        expect(updateRes.body.status).toBe('confirmed');
        console.log('  ✓ Business Owner can confirm appointments');
      }
    });

    it('AC-4.3: Backend must verify authorization before status change', async () => {
      console.log('\n[AT-04.3] Testing authorization checks...');

      // Customer 2 trying to modify Customer 1's appointment
      const res = await request(app)
        .put(`/api/appointments/${appointmentId}/status`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ status: 'cancelled' });

      console.log(`  Unauthorized attempt status: ${res.statusCode}`);
      expect([403, 404]).toContain(res.statusCode); // Forbidden or Not Found
      console.log('  ✓ Unauthorized status change prevented');
    });

    it('AC-4.4: Status badge reflects current state in database', (done) => {
      console.log('\n[AT-04.4] Verifying database status consistency...');

      db.get(
        'SELECT status FROM appointments WHERE id = ?',
        [appointmentId],
        (err, row) => {
          console.log(`  Database status: ${row.status}`);
          expect(row.status).toBe('confirmed');
          console.log('  ✓ Database status matches expected state');
          done();
        }
      );
    });

    it('AC-4.5: Cancelled slot becomes available for other users', async () => {
      console.log('\n[AT-04.5] Verifying cancelled slot availability...');

      // Get the cancelled appointment details
      const cancelledAppt = await new Promise((resolve) => {
        db.get(
          'SELECT appointment_date, start_time FROM appointments WHERE id = ?',
          [managementAppointmentId],
          (err, row) => resolve(row)
        );
      });

      // Check if the slot is now available
      const availRes = await request(app)
        .get(`/api/businesses/${businessId}/availability`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .query({
          service_id: serviceId,
          date: cancelledAppt.appointment_date
        });

      const slotAvailable = availRes.body.slots.some(
        slot => slot.time === cancelledAppt.start_time
      );

      console.log(`  Cancelled appointment time: ${cancelledAppt.start_time}`);
      console.log(`  Slot available again: ${slotAvailable}`);
      expect(slotAvailable).toBe(true);
      console.log('  ✓ Cancelled slot is available for rebooking');
    });
  });
});
