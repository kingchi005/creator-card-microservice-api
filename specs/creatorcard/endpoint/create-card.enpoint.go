GetCreatorCardsRequest { // Retrieves a single Creator Card by its slug
  path /creator-cards
  method POST

	query {
		access_code string
	}

	body {
  	title string<minLength:3|maxLength:100>
		description? string<maxLength:500>
		slug? string<minLength:5|maxLength:50>
		creator_reference string<length:20>
		links[]? { // Links the creator wants to showcase
			title string<minLength:1|maxLength:100>
			url string<maxLength:200|startsWith:http:\/\/|startsWith:https:\/\/>
		}
		service_rates? { // Rates offered by the creator for services
			currency string(NGN|USD|GBP|GHS)
			rates[] { // Individual service rates
				name string<minLength:3|maxLength:100>
				description string<maxLength:250>
				amount number<min:1>
			}
		}
		status string(draft|published)
		access_type? string(public|private)
		access_code? string<length:6>
  }
  
  response.ok {
		http.code 201
		status success,
		message "Card Created Successfully.",
		data {
			id string
			title string
			description string
			slug string
			creator_reference string
			links[] {
				title string
				url string
			}
			service_rates {
				currency string(NGN|USD|GBP|GHS)
				rates[] {
					name string
					description string
					amount number<min:1>
				}
			}
			status published
			access_type public
			access_code? null
			created number
			updated number
			deleted? number
		}
	}
 
  response.error {
    http.code 400
    status error
    message "Slug is already taken"
		code SL02
  }
}
