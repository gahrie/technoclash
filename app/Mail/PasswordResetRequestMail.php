<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordResetRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public $resetURL;

    public function __construct($resetURL)
    {
        $this->resetURL = $resetURL;
    }

    public function build()
    {
        return $this->from(config('mail.from.address'), config('mail.from.name'))
                    ->subject('Reset Your Password')
                    ->view('emails.password_reset_request')
                    ->with(['resetURL' => $this->resetURL]);
    }
}