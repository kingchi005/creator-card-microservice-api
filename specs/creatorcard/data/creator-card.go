import ../commons.go

CreatorCard {
  _id string<isUnique|indexed> // Unique identifier (ULID), serialized as 'id' in API responses
  title string<minLength:3|maxLength:100> // Name of the creator card (e.g., "George Cooks")
  description string<maxLength:500> // Short biography or description of the card
  slug string<minLength:5|maxLength:50> // Public identifier used for card retrieval (alphanumeric, hyphens, underscores)
  creator_reference string<length:20> // Identifies the creator on the consuming service
  
  links[] { // Links the creator wants to showcase
    title string<minLength:1|maxLength:100> // Title of the link
    url string<maxLength:200|startsWith:http:\/\/|startsWith:https:\/\/> // Link URL destination
  }
  
  service_rates { // Rates offered by the creator for services
    currency string(NGN|USD|GBP|GHS) // Currency for all rates on the card
    rates[] { // Individual service rates
      name string<minLength:3|maxLength:100> // Service name (e.g., "IG Story Post")
      description string<maxLength:250> // Description of what the service entails
      amount number<min:1> // Cost in minor units (e.g., kobo, cents, pence, pesewas)
    }
  }
  
  status string(draft|published) // Card status. Drafts are omitted from public endpoints
  access_type string(public|private) // Access control type (defaults to public)
  access_code? string<length:6> // Required alphanumeric access code if access_type is private
}