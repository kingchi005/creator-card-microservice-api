Card {
	title string<minLength:3|maxLength:100>
  description? string<maxLength:500>
  slug? string<minLength:5|maxLength:50>
  creator_reference string<length:20>
  links[]? { // Links the creator wants to showcase
    title string<trim|minLength:1|maxLength:100>
    url string<trim|maxLength:200|startsWith:http:\/\/|startsWith:https:\/\/>
  }
  service_rates? { // Rates offered by the creator for services
    currency string(NGN|USD|GBP|GHS)
    rates[] { // Individual service rates
      name string<trim|minLength:3|maxLength:100>
      description string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}