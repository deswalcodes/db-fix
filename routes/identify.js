const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

router.post('/identify', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    // Validate: at least one must be provided
    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'email or phoneNumber is required' });
    }

    // Step 1: Find all contacts matching either email OR phoneNumber
    const query = [];
    if (email) query.push({ email });
    if (phoneNumber) query.push({ phoneNumber: String(phoneNumber) });

    let matchedContacts = await Contact.find({ $or: query });

    // Step 2: If NO matches — create a brand new primary contact
    if (matchedContacts.length === 0) {
      const newContact = await Contact.create({
        email: email || null,
        phoneNumber: phoneNumber ? String(phoneNumber) : null,
        linkedId: null,
        linkPrecedence: 'primary',
      });

      return res.status(200).json({
        contact: {
          primaryContatctId: newContact._id,
          emails: newContact.email ? [newContact.email] : [],
          phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
          secondaryContactIds: [],
        },
      });
    }

    // Step 3: Collect all primary IDs from matched contacts
    // A matched contact is either primary itself or points to a primary via linkedId
    const primaryIds = new Set();
    for (const c of matchedContacts) {
      if (c.linkPrecedence === 'primary') {
        primaryIds.add(c._id);
      } else {
        primaryIds.add(c.linkedId);
      }
    }

    // Step 4: Fetch ALL contacts under each of those primaryIds (the full cluster)
    let allRelatedContacts = await Contact.find({
      $or: [
        { _id: { $in: Array.from(primaryIds) } },
        { linkedId: { $in: Array.from(primaryIds) } },
      ],
    });

    // Step 5: If there are 2 separate primary clusters, merge them
    // The OLDER primary stays primary; the newer one becomes secondary
    const primaries = allRelatedContacts.filter(c => c.linkPrecedence === 'primary');

    if (primaries.length > 1) {
      // Sort by createdAt ascending — oldest is the true primary
      primaries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const truePrimary = primaries[0];
      const toDowngrade = primaries.slice(1); // all newer primaries become secondary

      for (const p of toDowngrade) {
        await Contact.findByIdAndUpdate(p._id, {
          linkPrecedence: 'secondary',
          linkedId: truePrimary._id,
          updatedAt: new Date(),
        });
        // Also re-link any secondaries that were under the downgraded primary
        await Contact.updateMany(
          { linkedId: p._id },
          { linkedId: truePrimary._id }
        );
      }

      // Re-fetch updated full cluster
      allRelatedContacts = await Contact.find({
        $or: [
          { _id: truePrimary._id },
          { linkedId: truePrimary._id },
        ],
      });
    }

    // Step 6: Identify the true primary (oldest)
    const finalPrimary = allRelatedContacts
      .filter(c => c.linkPrecedence === 'primary')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];

    // Step 7: Check if the incoming request has NEW info not yet in the cluster
    const allEmails = allRelatedContacts.map(c => c.email).filter(Boolean);
    const allPhones = allRelatedContacts.map(c => c.phoneNumber).filter(Boolean);

    const isNewEmail = email && !allEmails.includes(email);
    const isNewPhone = phoneNumber && !allPhones.includes(String(phoneNumber));

    if (isNewEmail || isNewPhone) {
      // Create a new secondary contact with the new info
      await Contact.create({
        email: email || null,
        phoneNumber: phoneNumber ? String(phoneNumber) : null,
        linkedId: finalPrimary._id,
        linkPrecedence: 'secondary',
      });

      // Re-fetch to include the newly created secondary
      allRelatedContacts = await Contact.find({
        $or: [
          { _id: finalPrimary._id },
          { linkedId: finalPrimary._id },
        ],
      });
    }

    // Step 8: Build the response
    const secondaries = allRelatedContacts.filter(c => c.linkPrecedence === 'secondary');

    // Emails: primary's email first, then secondary emails (deduplicated)
    const emailList = [];
    if (finalPrimary.email) emailList.push(finalPrimary.email);
    for (const c of secondaries) {
      if (c.email && !emailList.includes(c.email)) emailList.push(c.email);
    }

    // Phone numbers: primary's phone first, then secondary phones (deduplicated)
    const phoneList = [];
    if (finalPrimary.phoneNumber) phoneList.push(finalPrimary.phoneNumber);
    for (const c of secondaries) {
      if (c.phoneNumber && !phoneList.includes(c.phoneNumber)) phoneList.push(c.phoneNumber);
    }

    return res.status(200).json({
      contact: {
        primaryContatctId: finalPrimary._id,  // Note: typo is intentional — matches assignment spec
        emails: emailList,
        phoneNumbers: phoneList,
        secondaryContactIds: secondaries.map(c => c._id),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
