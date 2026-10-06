import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { supabase } from './supabaseClient.js';
document.addEventListener('DOMContentLoaded', () => {
  const pageTitle = document.querySelector('h1')?.textContent;

  if (pageTitle === 'People Search') initPeopleSearch();
  else if (pageTitle === 'Vehicle Search') initVehicleSearch();
  else if (pageTitle === 'Add a Vehicle') initAddVehicle();
});

function initPeopleSearch() {
  const form = document.getElementById('people-form');
  const nameInput = document.getElementById('name');
  const licenseInput = document.getElementById('license');
  const message = document.getElementById('message');
  const results = document.getElementById('results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    results.innerHTML = '';
    message.textContent = '';

    const name = nameInput.value.trim();
    const license = licenseInput.value.trim();

    if ((!name && !license) || (name && license)) {
      message.textContent = 'Error: provide only one field.';
      return;
    }

    let query = supabase.from('People').select('*');
    if (name) {
      query = query.ilike('Name', `%${name}%`);
    } else {
      query = query.ilike('LicenseNumber', `%${license}%`);
    }

    const { data, error } = await query;

    if (error) {
      message.textContent = 'Error: something went wrong.';
    } else if (!data.length) {
      message.textContent = 'No result found';
    } else {
      message.textContent = 'Search successful';
      data.forEach(person => {
        const div = document.createElement('div');
        div.textContent = `${person.Name} — ${person.LicenseNumber}`;
        results.appendChild(div);
      });
    }
  });
}

function initVehicleSearch() {
  const form = document.getElementById('vehicle-form');
  const regoInput = document.getElementById('rego');
  const message = document.getElementById('message');
  const results = document.getElementById('results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    results.innerHTML = '';
    message.textContent = '';

    const rego = regoInput.value.trim();
    if (!rego) {
      message.textContent = 'Error: registration is required.';
      return;
    }

    const { data, error } = await supabase
      .from('Vehicles')
      .select('*, owner:People(*)')
      .eq('VehicleID', rego);

    if (error || !data.length) {
      message.textContent = 'No result found';
    } else {
      message.textContent = 'Search successful';
      data.forEach(vehicle => {
        const div = document.createElement('div');
        const owner = vehicle.owner
          ? `${vehicle.owner.Name} (${vehicle.owner.LicenseNumber})`
          : 'Unknown';
        div.innerHTML = `
          <strong>${vehicle.VehicleID}</strong><br/>
          ${vehicle.Make} ${vehicle.Model} (${vehicle.Colour})<br/>
          Owner: ${owner}
        `;
        results.appendChild(div);
      });
    }
  });
}

function initAddVehicle() {
  const ownerInput = document.getElementById('owner');
  const checkBtn = document.getElementById('check-owner');
  const ownerResults = document.getElementById('owner-results');
  const messageOwner = document.getElementById('message-owner');
  const messageVehicle = document.getElementById('message-vehicle');
  const newOwnerForm = document.getElementById('new-owner-form');
  const addOwnerBtn = document.getElementById('add-owner');
  const addVehicleBtn = document.getElementById('add-vehicle');

  let selectedOwnerId = null;

  // Enable "Check owner" button only if the input is not empty
  ownerInput.addEventListener('input', () => {
    checkBtn.disabled = ownerInput.value.trim() === '';
  });

  // Search for an existing owner
  checkBtn.addEventListener('click', async () => {
    const search = ownerInput.value.trim();
    ownerResults.innerHTML = '';
    messageOwner.textContent = '';
    selectedOwnerId = null;

    const { data, error } = await supabase
      .from('People')
      .select('*')
      .ilike('Name', `%${search}%`);

    if (error) {
      messageOwner.textContent = 'Error';
      return;
    }

    if (data.length > 0) {
      data.forEach(person => {
        const div = document.createElement('div');
        div.innerHTML = `
          ${person.Name} — ${person.LicenseNumber}<br/>
          <button type="button">Select owner</button>
        `;
        div.querySelector('button').addEventListener('click', () => {
          selectedOwnerId = person.PersonID;
          messageOwner.textContent = `Selected owner: ${person.Name}`;
        });
        ownerResults.appendChild(div);
      });
    }

    // Always show New owner option
    const newOwnerBtn = document.createElement('button');
    newOwnerBtn.textContent = 'New owner';
    newOwnerBtn.type = 'button';
    newOwnerBtn.addEventListener('click', () => {
      newOwnerForm.style.display = 'block';
    });
    ownerResults.appendChild(newOwnerBtn);
  });

  // Add new owner to People table
  addOwnerBtn.addEventListener('click', async () => {
    const name = document.querySelector('#new-owner-form #name').value.trim();
    const address = document.querySelector('#address').value.trim();
    const dob = document.querySelector('#dob').value.trim();
    const license = document.querySelector('#new-owner-form #license').value.trim();
    const expire = document.querySelector('#expire').value.trim();

    if (!name || !address || !dob || !license || !expire) {
      messageOwner.textContent = 'Error: All fields are required';
      return;
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('People')
      .select('*')
      .eq('Name', name)
      .eq('Address', address)
      .eq('DOB', dob)
      .eq('LicenseNumber', license)
      .eq('ExpiryDate', expire);

    if (existing.length > 0) {
      messageOwner.textContent = 'Error: Duplicate owner';
      return;
    }

    const { data, error } = await supabase
      .from('People')
      .insert([{
        Name: name,
        Address: address,
        DOB: dob,
        LicenseNumber: license,
        ExpiryDate: expire
      }])
      .select();

    if (error || !data || data.length === 0) {
      console.error('Insert owner error:', error.message);
      messageOwner.textContent = 'Error';
    } else {
      selectedOwnerId = data[0].PersonID;
      messageOwner.textContent = 'Owner added successfully';
    }
  });

  // Add vehicle to Vehicle table
  addVehicleBtn.addEventListener('click', async () => {
    const rego = document.getElementById('rego').value.trim();
    const make = document.getElementById('make').value.trim();
    const model = document.getElementById('model').value.trim();
    const colour = document.getElementById('colour').value.trim();

    if (!rego || !make || !model || !colour || !selectedOwnerId) {
      messageVehicle.textContent = 'Error: All fields are required and owner must be selected';
      return;
    }

    const { error } = await supabase.from('Vehicles').insert([{
      VehicleID: rego,
      Make: make,
      Model: model,
      Colour: colour,
      OwnerID: selectedOwnerId
    }]);

    if (error) {
      console.error('Insert vehicle error:', error.message);
      messageVehicle.textContent = 'Error';
    } else {
      messageVehicle.textContent = 'Vehicle added successfully';
    }
  });
}
