
// Smooth scrolling for navigation links
function scrollToContact() {
  document.getElementById('contact').scrollIntoView({
    behavior: 'smooth'
  });
}

// Handle contact form submission
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  // Get form data
  const formData = new FormData(this);
  const name = formData.get('name');
  const email = formData.get('email');
  const company = formData.get('company') || 'Not provided';
  const message = formData.get('message');
  
  // Show loading state
  const submitButton = this.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  submitButton.innerHTML = '<i data-lucide="loader-2"></i> Sending...';
  submitButton.disabled = true;
  
  try {
    // Send email using Formspree (free service for static sites)
    const formspree = "https://formspree.io/f/mzzvdkoz";
    const response = await fetch(formspree, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        email: email,
        company: company,
        message: message,
        _replyto: email,
        _subject: `NavianAI Inquiry from ${name}`,
        _to: 'gargkeshav504@gmail.com'
      })
    });
    
    if (response.ok) {
      // Show success message
      alert('Thank you for your message! We\'ll get back to you soon.');
      
      // Reset form
      this.reset();
    } else {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    alert('Sorry, there was an error sending your message. Please try again or contact us directly at gargkeshav504@gmail.com');
  } finally {
    // Restore button state
    submitButton.innerHTML = originalText;
    submitButton.disabled = false;
    // Re-initialize icons
    lucide.createIcons();
  }
});

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 100) {
    navbar.style.background = 'rgba(255, 255, 255, 0.95)';
  } else {
    navbar.style.background = 'rgba(255, 255, 255, 0.8)';
  }
});

// Smooth scrolling for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});
