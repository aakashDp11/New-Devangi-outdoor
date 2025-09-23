// server/controllers/ticketController.js

import Ticket from '../models/ticket.model.js';
import User from '../models/user.model.js';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

// --- NODEMAILER TRANSPORTER SETUP (Same as authController) ---
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// --- MULTER SETUP FOR FILE UPLOADS ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/tickets';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, PDFs, and document files are allowed'));
        }
    }
});

// --- EMAIL HELPERS ---
const sendTicketCreationEmail = async (ticket, user) => {
    const mailOptions = {
        from: '"blackOutdoor Support" <devangioutdoor@gmail.com>',
        to: user.email,
        subject: `Support Ticket Created - ${ticket.ticketId}`,
        html: `
            <h3>Support Ticket Created Successfully</h3>
            <p>Dear ${user.name},</p>
            <p>Your support ticket has been created successfully. Here are the details:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
                <p><strong>Subject:</strong> ${ticket.subject}</p>
                <p><strong>Category:</strong> ${ticket.category}</p>
                <p><strong>Priority:</strong> ${ticket.priority}</p>
                <p><strong>Status:</strong> ${ticket.status}</p>
            </div>
            <p>We will get back to you as soon as possible. You can track your ticket status by logging into your account.</p>
            <p>Thank you for contacting us!</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Ticket creation email sent to ${user.email}`);
    } catch (err) {
        console.error(`❌ Failed to send ticket creation email:`, err);
    }
};

const sendTicketUpdateEmail = async (ticket, user, message) => {
    const mailOptions = {
        from: '"blackOutdoor Support" <devangioutdoor@gmail.com>',
        to: user.email,
        subject: `Ticket Update - ${ticket.ticketId}`,
        html: `
            <h3>Support Ticket Update</h3>
            <p>Dear ${user.name},</p>
            <p>There's an update on your support ticket:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
                <p><strong>Subject:</strong> ${ticket.subject}</p>
                <p><strong>Status:</strong> ${ticket.status}</p>
            </div>
            <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Update:</strong></p>
                <p>${message}</p>
            </div>
            <p>You can view the full ticket details by logging into your account.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Ticket update email sent to ${user.email}`);
    } catch (err) {
        console.error(`❌ Failed to send ticket update email:`, err);
    }
};

const sendNewTicketEmailToSupport = async (ticket, recipientEmail) => {
    const mailOptions = {
        from: '"blackOutdoor Support" <devangioutdoor@gmail.com>',
        to: recipientEmail,
        subject: `New Support Ticket - ${ticket.ticketId}: ${ticket.subject}`,
        html: `
            <h3>A new support ticket has been created.</h3>
            <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
            <p><strong>Created by:</strong> ${ticket.createdBy.name} (${ticket.createdBy.email})</p>
            <p><strong>Subject:</strong> ${ticket.subject}</p>
            <p><strong>Description:</strong> ${ticket.description}</p>
            <p><strong>Category:</strong> ${ticket.category}</p>
            <p><strong>Priority:</strong> ${ticket.priority}</p>
            <p>You can view the full ticket details in the admin dashboard.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ New ticket email sent to support team`);
    } catch (err) {
        console.error(`❌ Failed to send new ticket email to support:`, err);
    }
};

const generateNewTicketId = async () => {
    const count = await Ticket.countDocuments();
    return `TKT-${String(count + 1).padStart(6, '0')}`;
};

// --- TICKET CONTROLLERS ---

export const createTicket = async (req, res) => {
    try {
        const { subject, description, category, priority } = req.body;
        const createdBy = req.user.id;

        const ticketId = await generateNewTicketId();

        const attachments = req.files ? req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype
        })) : [];

        const ticket = new Ticket({
            ticketId,
            subject,
            description,
            category,
            priority,
            createdBy,
            attachments,
            messages: [{
                sender: createdBy,
                message: description,
                timestamp: new Date()
            }]
        });

        await ticket.save();
        await ticket.populate('createdBy', 'name email');

        const superAdmin = await User.findOne({ role: 'admin' });
        
        await sendTicketCreationEmail(ticket, ticket.createdBy);

        if (superAdmin) {
            await sendNewTicketEmailToSupport(ticket, superAdmin.email);
        }

        res.status(201).json({
            message: 'Support ticket created successfully',
            ticket: {
                ticketId: ticket.ticketId,
                subject: ticket.subject,
                status: ticket.status,
                priority: ticket.priority,
                category: ticket.category,
                createdAt: ticket.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Error creating support ticket', error: error.message });
    }
};

export const createEmailTicket = async (req, res) => {
    try {
        const { senderEmail, receiverEmail, subject, description, priority, category } = req.body;

        let user = await User.findOne({ email: senderEmail });
        if (!user) {
            user = new User({
                name: senderEmail.split('@')[0],
                email: senderEmail,
                role: 'user',
                password: 'default_password_if_needed'
            });
            await user.save();
        }

        const ticketId = await generateNewTicketId();

        const ticket = new Ticket({
            ticketId,
            subject,
            description,
            category,
            priority,
            createdBy: user._id,
            messages: [{
                sender: user._id,
                message: description,
                timestamp: new Date()
            }],
            receiverEmail
        });

        await ticket.save();
        await ticket.populate('createdBy', 'name email');
        
        const mailOptions = {
            from: senderEmail,
            to: receiverEmail,
            subject: `[${priority} | ${category}] Support Ticket: ${subject}`,
            html: `
                <h3>New Ticket from Website Email Form</h3>
                <p><strong>Sender:</strong> ${senderEmail}</p>
                <p><strong>Priority:</strong> ${priority}</p>
                <p><strong>Category:</strong> ${category}</p>
                <br>
                <p><strong>Description:</strong></p>
                <p>${description}</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: 'Ticket created successfully and email sent!',
            ticket: {
                ticketId: ticket.ticketId,
                subject: ticket.subject,
                status: ticket.status,
                priority: ticket.priority,
                category: ticket.category,
                createdAt: ticket.createdAt
            }
        });

    } catch (error) {
        console.error('Error creating ticket from email form:', error);
        res.status(500).json({ message: 'Failed to create ticket from email form.', error: error.message });
    }
};

export const updateTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status, priority, category } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const ticket = await Ticket.findOne({ ticketId });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (userRole !== 'admin' && ticket.createdBy._id.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied. You can only edit your own tickets.' });
        }

        // Fix: Assign the new status to the ticket object
        ticket.status = status;
        ticket.priority = priority;
        ticket.category = category;

        await ticket.save();

        res.json({ message: 'Ticket updated successfully', ticket });

    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ message: 'Error updating ticket', error: error.message });
    }
};

export const deleteTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const ticket = await Ticket.findOne({ ticketId });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (userRole !== 'admin' && ticket.createdBy._id.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied. You can only delete your own tickets.' });
        }
        
        const result = await Ticket.deleteOne({ ticketId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json({ message: `Ticket ${ticketId} deleted successfully` });

    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ message: 'Error deleting ticket', error: error.message });
    }
};

export const getUserTickets = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 10, status, priority, category } = req.query;

        const filter = { createdBy: userId };
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;

        const tickets = await Ticket.find(filter)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Ticket.countDocuments(filter);

        res.json({
            tickets,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Error fetching user tickets:', error);
        res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const filter = userRole === 'admin' ? { ticketId } : { ticketId, createdBy: userId };

        const ticket = await Ticket.findOne(filter)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('messages.sender', 'name email role');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json(ticket);

    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ message: 'Error fetching ticket', error: error.message });
    }
};

export const addTicketMessage = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message, isInternal = false } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const ticket = await Ticket.findOne({ ticketId })
            .populate('createdBy', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (userRole !== 'admin' && ticket.createdBy._id.toString() !== userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        ticket.messages.push({
            sender: userId,
            message,
            isInternal: userRole === 'admin' ? isInternal : false,
            timestamp: new Date()
        });

        if (userRole !== 'admin' && (ticket.status === 'resolved' || ticket.status === 'closed')) {
            ticket.status = 'open';
        }

        await ticket.save();
        await ticket.populate('messages.sender', 'name email role');
        
        if (ticket.createdBy._id.toString() !== userId) {
            await sendTicketUpdateEmail(ticket, ticket.createdBy, message);
        }

        res.json({ message: 'Message added successfully', ticket });

    } catch (error) {
        console.error('Error adding message:', error);
        res.status(500).json({ message: 'Error adding message', error: error.message });
    }
};

export const updateTicketStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status, resolution } = req.body;
        const userId = req.user.id;

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const ticket = await Ticket.findOne({ ticketId })
            .populate('createdBy', 'name email');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.status = status;

        if (status === 'resolved') {
            ticket.resolution = resolution;
            ticket.resolvedBy = userId;
            ticket.resolvedAt = new Date();
        }

        await ticket.save();

        const updateMessage = status === 'resolved'
            ? `Your ticket has been resolved. Resolution: ${resolution}`
            : `Your ticket status has been updated to: ${status}`;

        await sendTicketUpdateEmail(ticket, ticket.createdBy, updateMessage);

        res.json({ message: 'Ticket status updated successfully', ticket });

    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({ message: 'Error updating ticket status', error: error.message });
    }
};

export const getAllTickets = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { page = 1, limit = 10, status, priority, category, search } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (category) filter.category = category;
        if (search) {
            filter.$or = [
                { subject: { $regex: search, $options: 'i' } },
                { ticketId: { $regex: search, $options: 'i' } }
            ];
        }

        const tickets = await Ticket.find(filter)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Ticket.countDocuments(filter);

        res.json({
            tickets,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error('Error fetching all tickets:', error);
        res.status(500).json({ message: 'Error fetching tickets', error: error.message });
    }
};

export const getTicketStats = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const stats = await Ticket.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    open: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
                    resolved: { $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] } },
                    closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
                    urgent: { $sum: { $cond: [{ $eq: ["$priority", "urgent"] }, 1, 0] } },
                    high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } }
                }
            }
        ]);

        const categoryStats = await Ticket.aggregate([
            {
                $group: {
                    _id: "$category",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            overview: stats[0] || {
                total: 0,
                open: 0,
                inProgress: 0,
                resolved: 0,
                closed: 0,
                urgent: 0,
                high: 0
            },
            byCategory: categoryStats
        });

    } catch (error) {
        console.error('Error fetching ticket stats:', error);
        res.status(500).json({ message: 'Error fetching ticket statistics', error: error.message });
    }
};