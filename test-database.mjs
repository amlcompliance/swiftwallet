#!/usr/bin/env node
/**
 * Test SwiftPay Database Integration
 * Verifies that transactions are properly stored in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseIntegration() {
  console.log('\n════════════════════════════════════════════');
  console.log('   📊 SwiftPay Database Integration Test');
  console.log('════════════════════════════════════════════\n');

  try {
    // 1. Check if test user exists
    console.log('📋 Test 1: Check Test User\n');
    const user = await prisma.user.findUnique({
      where: { email: 'test@swiftwallet.local' }
    });

    if (user) {
      console.log('✅ Test user found:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Balance: PHP ${user.balance.toFixed(2)}`);
    } else {
      console.log('❌ Test user not found');
      return;
    }

    // 2. Create test transactions
    console.log('\n📋 Test 2: Create Test Transactions\n');

    const transactions = [
      {
        type: 'COLLECTION',
        amount: 1000,
        currency: 'PHP',
        status: 'EXECUTED',
        provider: 'SWIFTPAY',
        reference: `COL-${Date.now()}`
      },
      {
        type: 'DISBURSEMENT',
        amount: 500,
        currency: 'PHP',
        status: 'PENDING',
        provider: 'SWIFTPAY',
        reference: `DISB-${Date.now() + 1}`
      },
      {
        type: 'COLLECTION',
        amount: 2000,
        currency: 'PHP',
        status: 'EXECUTED',
        provider: 'SWIFTPAY',
        reference: `LINK-${Date.now() + 2}`
      }
    ];

    for (const tx of transactions) {
      const created = await prisma.transaction.create({
        data: {
          userId: user.id,
          ...tx
        }
      });

      console.log(`✅ Created ${tx.type} transaction:`);
      console.log(`   Reference: ${created.reference}`);
      console.log(`   Amount: PHP ${created.amount.toFixed(2)}`);
      console.log(`   Status: ${created.status}\n`);
    }

    // 3. Query transactions
    console.log('\n📋 Test 3: Query User Transactions\n');

    const userTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${userTransactions.length} transactions:\n`);
    userTransactions.forEach((tx, idx) => {
      console.log(`   ${idx + 1}. ${tx.type} - PHP ${tx.amount.toFixed(2)} - ${tx.status}`);
      console.log(`      Reference: ${tx.reference}`);
    });

    // 4. Calculate totals
    console.log('\n📋 Test 4: Transaction Summary\n');

    const executed = userTransactions.filter(tx => tx.status === 'EXECUTED');
    const pending = userTransactions.filter(tx => tx.status === 'PENDING');

    const executedTotal = executed.reduce((sum, tx) => sum + tx.amount, 0);
    const pendingTotal = pending.reduce((sum, tx) => sum + tx.amount, 0);

    console.log(`✅ Executed transactions: ${executed.length}`);
    console.log(`   Total: PHP ${executedTotal.toFixed(2)}\n`);

    console.log(`⏳ Pending transactions: ${pending.length}`);
    console.log(`   Total: PHP ${pendingTotal.toFixed(2)}\n`);

    // 5. Test webhook simulation
    console.log('\n📋 Test 5: Simulate Webhook Update\n');

    const refToUpdate = userTransactions[0]?.reference;
    if (refToUpdate) {
      const updated = await prisma.transaction.update({
        where: { reference: refToUpdate },
        data: {
          status: 'EXECUTED',
          externalId: 'ext-webhook-123',
          rawPayload: JSON.stringify({ test: true })
        }
      });

      console.log('✅ Webhook simulation completed:');
      console.log(`   Reference: ${updated.reference}`);
      console.log(`   New Status: ${updated.status}`);
      console.log(`   External ID: ${updated.externalId}\n`);
    }

    // 6. Test balance update
    console.log('\n📋 Test 6: Simulate Balance Update\n');

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { balance: { increment: executedTotal } }
    });

    console.log('✅ Balance updated after executed transactions:');
    console.log(`   Previous: PHP ${user.balance.toFixed(2)}`);
    console.log(`   Increment: PHP ${executedTotal.toFixed(2)}`);
    console.log(`   New Balance: PHP ${updatedUser.balance.toFixed(2)}\n`);

    // 7. Verify data integrity
    console.log('\n📋 Test 7: Data Integrity Check\n');

    const finalTransactions = await prisma.transaction.findMany({
      where: { userId: user.id }
    });

    const allValid = finalTransactions.every(tx => 
      tx.userId === user.id &&
      tx.amount > 0 &&
      ['COLLECTION', 'DISBURSEMENT'].includes(tx.type) &&
      ['PENDING', 'EXECUTED', 'REJECTED'].includes(tx.status)
    );

    if (allValid) {
      console.log('✅ All transactions have valid data structure\n');
    } else {
      console.log('❌ Some transactions have invalid data\n');
    }

    // Summary
    console.log('\n════════════════════════════════════════════');
    console.log('   ✅ Database Integration Test Complete');
    console.log('════════════════════════════════════════════\n');

    console.log('📊 Summary:');
    console.log(`   • Test User: ${user.email}`);
    console.log(`   • Current Balance: PHP ${updatedUser.balance.toFixed(2)}`);
    console.log(`   • Total Transactions: ${finalTransactions.length}`);
    console.log(`   • Final Balance: PHP ${updatedUser.balance.toFixed(2)}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseIntegration();
