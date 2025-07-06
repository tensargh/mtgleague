import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, role, inviteLink } = await request.json()

    if (!email || !role || !inviteLink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    console.log('Sending email to:', email, 'with role:', role)

    const roleDisplay = role === 'admin' ? 'Administrator' : 'Tournament Organizer'

    const { data, error } = await resend.emails.send({
      from: 'MtgLeague <onboarding@resend.dev>', // Use Resend's default verified domain
      to: [email],
      subject: `You're invited to join MtgLeague as a ${roleDisplay}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">MtgLeague</h1>
              <p style="color: #64748b; margin: 5px 0 0 0;">Magic: The Gathering Tournament Management</p>
            </div>
            
            <h2 style="color: #1e293b; margin-bottom: 20px;">Welcome to MtgLeague!</h2>
            <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
              You've been invited to join MtgLeague as a <strong style="color: #2563eb;">${roleDisplay}</strong>.
            </p>
            <p style="color: #475569; line-height: 1.6; margin-bottom: 30px;">
              Click the button below to accept your invitation and create your account:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 30px 0;">
              <p style="color: #64748b; font-size: 14px; margin: 0; text-align: center;">
                ⏰ This invitation will expire in 7 days
              </p>
            </div>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            
            <div style="text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                This is an automated message from MtgLeague. Please do not reply to this email.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 5px 0 0 0;">
                If you have any questions, please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      )
    }

    console.log('Email sent successfully:', data)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Send invite error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
} 